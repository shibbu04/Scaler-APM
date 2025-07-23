const express = require('express');
const router = express.Router();
const axios = require('axios');
const Lead = require('../models/Lead');
const { generatePersonalizedResponse } = require('../services/aiService');

// POST /api/chatbot/interact - Handle chatbot interactions
router.post('/interact', async (req, res) => {
  try {
    const { 
      email,
      message,
      sessionId,
      userInfo = {},
      context = {}
    } = req.body;

    // Find or create lead
    let lead = await Lead.findOne({ email });
    if (!lead && email) {
      lead = new Lead({
        email,
        firstName: userInfo.firstName || 'Anonymous',
        lastName: userInfo.lastName || '',
        phone: userInfo.phone || '',
        source: context.source || 'blog',
        utmSource: context.utmSource,
        utmMedium: context.utmMedium,
        utmCampaign: context.utmCampaign,
        referrerUrl: context.referrerUrl
      });
      await lead.save();
    }

    // Determine intent from message
    const intent = await determineIntent(message);
    
    // Generate personalized response
    const response = await generatePersonalizedResponse(message, intent, lead);

    // Record interaction
    if (lead) {
      lead.chatbotInteractions.push({
        message,
        response: response.text,
        intent,
        timestamp: new Date()
      });
      
      // Update lead stage and info based on intent
      await updateLeadBasedOnIntent(lead, intent, userInfo);
      await lead.save();
    }

    res.json({
      response: response.text,
      intent,
      actions: response.actions || [],
      leadId: lead?._id,
      sessionId
    });

  } catch (error) {
    console.error('Chatbot interaction error:', error);
    res.status(500).json({ 
      response: "I'm sorry, I'm having technical difficulties. Please try again later.",
      error: 'Chatbot service unavailable'
    });
  }
});

// POST /api/chatbot/collect-info - Collect user information
router.post('/collect-info', async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      careerGoal,
      experienceLevel,
      currentRole,
      company
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Update or create lead with collected information
    let lead = await Lead.findOneAndUpdate(
      { email },
      {
        firstName: firstName || 'Anonymous',
        lastName: lastName || '',
        phone: phone || '',
        careerGoal,
        experienceLevel,
        currentRole,
        company,
        stage: 'warm', // Move to warm stage after info collection
        lastTouchpoint: 'chatbot'
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Generate personalized follow-up message
    const followUpMessage = await generateFollowUpMessage(lead);

    res.json({
      message: 'Information collected successfully',
      followUpMessage,
      leadId: lead._id,
      nextAction: 'offer_resource_or_call'
    });

  } catch (error) {
    console.error('Info collection error:', error);
    res.status(500).json({ error: 'Failed to collect information' });
  }
});

// POST /api/chatbot/request-callback - Request a callback
router.post('/request-callback', async (req, res) => {
  try {
    const { email, preferredTime, timezone, urgency } = req.body;

    const lead = await Lead.findOne({ email });
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Update lead with callback request
    lead.stage = 'hot';
    lead.lastTouchpoint = 'call-booked';
    lead.notes = `Callback requested - Preferred time: ${preferredTime}, Timezone: ${timezone}, Urgency: ${urgency}`;
    
    await lead.save();

    // Trigger notification to sales team (webhook to Zapier)
    await triggerCallbackNotification(lead, { preferredTime, timezone, urgency });

    res.json({
      message: 'Callback request submitted successfully',
      expectedCallback: 'within 24 hours',
      leadId: lead._id
    });

  } catch (error) {
    console.error('Callback request error:', error);
    res.status(500).json({ error: 'Failed to process callback request' });
  }
});

// GET /api/chatbot/bot-config - Get chatbot configuration
router.get('/bot-config', (req, res) => {
  const config = {
    welcomeMessage: "Hi! 👋 I'm here to help you accelerate your tech career. What's your biggest goal right now?",
    quickReplies: [
      "Learn Data Engineering",
      "Switch to Tech",
      "Get Better Job",
      "Skill Assessment"
    ],
    flows: {
      greeting: {
        triggers: ["hi", "hello", "hey", "start"],
        response: "Hello! I'm excited to help you with your tech career journey. To get started, could you tell me your name and what you're looking to achieve?"
      },
      career_goal: {
        triggers: ["data engineering", "software engineering", "career switch", "job"],
        response: "That's a great goal! {name}, I'd love to share some resources that could help. Could you share your email so I can send you a personalized roadmap?"
      },
      resource_sharing: {
        triggers: ["roadmap", "resources", "guide", "help"],
        response: "Perfect! I'll send you our comprehensive career roadmap. Would you also like to book a free 30-minute consultation with one of our career experts?"
      },
      booking: {
        triggers: ["book", "call", "consultation", "expert", "yes"],
        response: "Excellent! I'll connect you with our booking system. Our experts have helped 10,000+ professionals land their dream tech jobs."
      }
    }
  };

  res.json(config);
});

// Helper Functions

async function determineIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  // Simple intent classification (in production, use ML/NLP service)
  if (lowerMessage.includes('data engineer') || lowerMessage.includes('data science')) {
    return 'data_engineering_interest';
  } else if (lowerMessage.includes('software engineer') || lowerMessage.includes('coding')) {
    return 'software_engineering_interest';
  } else if (lowerMessage.includes('career') || lowerMessage.includes('job') || lowerMessage.includes('switch')) {
    return 'career_guidance';
  } else if (lowerMessage.includes('course') || lowerMessage.includes('program') || lowerMessage.includes('learn')) {
    return 'course_interest';
  } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('fee')) {
    return 'pricing_inquiry';
  } else if (lowerMessage.includes('book') || lowerMessage.includes('call') || lowerMessage.includes('consultation')) {
    return 'booking_intent';
  } else if (lowerMessage.includes('bye') || lowerMessage.includes('thanks') || lowerMessage.includes('thank you')) {
    return 'goodbye';
  } else {
    return 'general_inquiry';
  }
}

async function updateLeadBasedOnIntent(lead, intent, userInfo) {
  switch (intent) {
    case 'data_engineering_interest':
      lead.careerGoal = 'data-engineering';
      break;
    case 'software_engineering_interest':
      lead.careerGoal = 'software-engineering';
      break;
    case 'course_interest':
      if (lead.stage === 'cold') lead.stage = 'warm';
      break;
    case 'booking_intent':
      lead.stage = 'hot';
      break;
  }

  // Update any additional user info
  if (userInfo.currentRole) lead.currentRole = userInfo.currentRole;
  if (userInfo.company) lead.company = userInfo.company;
  if (userInfo.experienceLevel) lead.experienceLevel = userInfo.experienceLevel;
}

async function generateFollowUpMessage(lead) {
  const messages = {
    'data-engineering': `Great choice, ${lead.firstName}! Data Engineering is one of the hottest fields right now. I'll send you our "Complete Data Engineering Roadmap" to your email. Would you like to speak with one of our Data Engineering experts for a free career consultation?`,
    'software-engineering': `Excellent, ${lead.firstName}! Software Engineering offers amazing opportunities. I'm sending you our "Software Engineer Career Guide" right now. Want to chat with a senior engineer about your path forward?`,
    'ai-ml': `Fantastic, ${lead.firstName}! AI/ML is transforming every industry. Check your email for our "AI Career Transition Guide". Ready to discuss your AI journey with an expert?`,
    'default': `Thanks for sharing that information, ${lead.firstName}! I'm preparing some personalized resources for you. Would you like to book a free consultation to discuss your career goals in detail?`
  };

  return messages[lead.careerGoal] || messages.default;
}

async function triggerCallbackNotification(lead, callbackInfo) {
  try {
    // Send webhook to Zapier for sales team notification
    if (process.env.ZAPIER_WEBHOOK_URL) {
      await axios.post(process.env.ZAPIER_WEBHOOK_URL, {
        leadId: lead._id,
        email: lead.email,
        name: lead.fullName,
        phone: lead.phone,
        careerGoal: lead.careerGoal,
        callbackRequest: callbackInfo,
        leadScore: lead.leadScore,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Failed to trigger callback notification:', error);
  }
}

module.exports = router;
