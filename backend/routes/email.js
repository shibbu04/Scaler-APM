const express = require('express');
const router = express.Router();
const Mailchimp = require('mailchimp-api-v3');
const Lead = require('../models/Lead');
const { generatePersonalizedEmail } = require('../services/aiService');

// Initialize Mailchimp
const mailchimp = new Mailchimp(process.env.MAILCHIMP_API_KEY);

// POST /api/email/subscribe - Subscribe lead to email sequence
router.post('/subscribe', async (req, res) => {
  try {
    const { email, firstName, lastName, careerGoal, source } = req.body;

    // Find lead in database
    const lead = await Lead.findOne({ email });
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Subscribe to Mailchimp list
    const subscribeData = {
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        FNAME: firstName || lead.firstName,
        LNAME: lastName || lead.lastName,
        CAREER: careerGoal || lead.careerGoal || 'general',
        SOURCE: source || lead.source,
        PHONE: lead.phone || '',
        COMPANY: lead.company || '',
        ROLE: lead.currentRole || ''
      },
      tags: [
        lead.careerGoal,
        lead.experienceLevel,
        `source-${lead.source}`,
        `stage-${lead.stage}`
      ].filter(Boolean)
    };

    await mailchimp.post(`/lists/${process.env.MAILCHIMP_LIST_ID}/members`, subscribeData);

    // Update lead stage and trigger welcome email sequence
    lead.stage = 'warm';
    lead.lastTouchpoint = 'email';
    await lead.save();

    // Send immediate welcome email with resource
    await sendWelcomeEmail(lead);

    res.json({ 
      message: 'Successfully subscribed to email sequence',
      leadId: lead._id 
    });

  } catch (error) {
    console.error('Email subscription error:', error);
    if (error.status === 400 && error.detail.includes('already a list member')) {
      res.status(200).json({ message: 'Already subscribed' });
    } else {
      res.status(500).json({ error: 'Failed to subscribe to email sequence' });
    }
  }
});

// POST /api/email/track-open - Track email opens
router.post('/track-open', async (req, res) => {
  try {
    const { email, emailId, campaignId } = req.body;

    const lead = await Lead.findOne({ email });
    if (lead) {
      lead.emailEngagement.opened += 1;
      lead.emailEngagement.lastOpened = new Date();
      await lead.save();
    }

    // Return 1x1 pixel image for email tracking
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // 1x1 transparent PNG pixel
    const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    res.send(pixel);

  } catch (error) {
    console.error('Email tracking error:', error);
    res.status(500).send('Error');
  }
});

// POST /api/email/track-click - Track email clicks
router.post('/track-click', async (req, res) => {
  try {
    const { email, url, emailId, campaignId } = req.body;

    const lead = await Lead.findOne({ email });
    if (lead) {
      lead.emailEngagement.clicked += 1;
      lead.emailEngagement.lastClicked = new Date();
      
      // Move to hot stage if they clicked CTA
      if (url.includes('book') || url.includes('call') || url.includes('consultation')) {
        lead.stage = 'hot';
      }
      
      await lead.save();
    }

    // Redirect to original URL
    res.redirect(url);

  } catch (error) {
    console.error('Email click tracking error:', error);
    res.redirect(req.body.url || 'https://scaler.com');
  }
});

// POST /api/email/send-nurture - Send nurture email based on lead stage
router.post('/send-nurture', async (req, res) => {
  try {
    const { leadId, emailType } = req.body;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    let emailTemplate;
    switch (emailType) {
      case 'resource-delivery':
        emailTemplate = await generateResourceDeliveryEmail(lead);
        break;
      case 'social-proof':
        emailTemplate = await generateSocialProofEmail(lead);
        break;
      case 'booking-reminder':
        emailTemplate = await generateBookingReminderEmail(lead);
        break;
      case 'final-offer':
        emailTemplate = await generateFinalOfferEmail(lead);
        break;
      default:
        return res.status(400).json({ error: 'Invalid email type' });
    }

    // Send via Mailchimp
    await sendTransactionalEmail(lead.email, emailTemplate);

    res.json({ 
      message: 'Nurture email sent successfully',
      emailType,
      leadId: lead._id
    });

  } catch (error) {
    console.error('Nurture email error:', error);
    res.status(500).json({ error: 'Failed to send nurture email' });
  }
});

// GET /api/email/templates - Get email templates
router.get('/templates', (req, res) => {
  const templates = {
    welcome: {
      subject: "🚀 Your Data Engineering Roadmap is Here, {{firstName}}!",
      preview: "Everything you need to start your journey...",
      content: getWelcomeEmailTemplate()
    },
    nurture1: {
      subject: "How {{firstName}} Can Land a $120K+ Data Engineering Role",
      preview: "Real success stories from our community...",
      content: getNurture1Template()
    },
    nurture2: {
      subject: "{{firstName}}, Your Free Career Consultation is Waiting",
      preview: "Book your slot before they're all taken...",
      content: getNurture2Template()
    },
    finalReminder: {
      subject: "Last chance: Your career breakthrough awaits, {{firstName}}",
      preview: "Don't let this opportunity slip away...",
      content: getFinalReminderTemplate()
    }
  };

  res.json({ templates });
});

// POST /api/email/bulk-send - Send bulk email campaign
router.post('/bulk-send', async (req, res) => {
  try {
    const { 
      segmentCriteria, 
      emailTemplate, 
      scheduledTime,
      testMode = false 
    } = req.body;

    // Find leads matching criteria
    const leads = await Lead.find({
      ...segmentCriteria,
      isActive: true
    }).limit(testMode ? 10 : 1000);

    const campaignId = `campaign_${Date.now()}`;
    let successCount = 0;
    let errorCount = 0;

    // Send emails in batches to avoid rate limiting
    const batchSize = 50;
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      
      const promises = batch.map(async (lead) => {
        try {
          const personalizedTemplate = await generatePersonalizedEmail(emailTemplate, lead);
          await sendTransactionalEmail(lead.email, personalizedTemplate);
          successCount++;
        } catch (error) {
          console.error(`Failed to send email to ${lead.email}:`, error);
          errorCount++;
        }
      });

      await Promise.all(promises);
      
      // Add delay between batches
      if (i + batchSize < leads.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    res.json({
      message: 'Bulk email campaign completed',
      campaignId,
      stats: {
        totalTargeted: leads.length,
        successCount,
        errorCount,
        successRate: ((successCount / leads.length) * 100).toFixed(2)
      }
    });

  } catch (error) {
    console.error('Bulk email error:', error);
    res.status(500).json({ error: 'Failed to send bulk email campaign' });
  }
});

// Helper Functions

async function sendWelcomeEmail(lead) {
  const template = {
    subject: `🚀 Your ${lead.careerGoal || 'Career'} Roadmap is Here, ${lead.firstName}!`,
    html: getWelcomeEmailTemplate(),
    text: getWelcomeEmailText()
  };

  return await sendTransactionalEmail(lead.email, template);
}

async function sendTransactionalEmail(email, template) {
  // Implementation depends on email service (Mailchimp Transactional, SendGrid, etc.)
  // For now, we'll use Mailchimp's transactional API
  
  const message = {
    message: {
      html: template.html,
      text: template.text,
      subject: template.subject,
      from_email: 'careers@scaler.com',
      from_name: 'Scaler Career Team',
      to: [{
        email: email,
        type: 'to'
      }],
      track_opens: true,
      track_clicks: true,
      auto_text: true,
      auto_html: false
    }
  };

  // Send via Mailchimp Transactional API (Mandrill)
  // This would require additional setup with Mandrill
  console.log('Sending email to:', email, 'Subject:', template.subject);
}

function getWelcomeEmailTemplate() {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🚀 Welcome to Your Journey!</h1>
        </div>
        
        <div style="padding: 30px;">
          <h2>Hi {{firstName}},</h2>
          
          <p>I'm excited you're taking the first step toward accelerating your tech career!</p>
          
          <p>As promised, here's your personalized career roadmap:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>🎯 Your {{careerGoal}} Roadmap</h3>
            <ul>
              <li>✅ Essential skills to master</li>
              <li>✅ Learning resources and timeline</li>
              <li>✅ Salary expectations and career paths</li>
              <li>✅ Interview preparation guide</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{bookingUrl}}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              📞 Book Your Free Career Consultation
            </a>
          </div>
          
          <p>Our career experts have helped 10,000+ professionals land their dream jobs at companies like Google, Microsoft, and Amazon.</p>
          
          <p>Ready to discuss your journey? Book a free 30-minute call above!</p>
          
          <p>Best regards,<br>
          The Scaler Career Team</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>Scaler Academy | Building the next generation of tech leaders</p>
          <img src="{{trackingPixel}}" width="1" height="1" style="display: none;">
        </div>
      </body>
    </html>
  `;
}

function getWelcomeEmailText() {
  return `
    Hi {{firstName}},
    
    Welcome to your tech career journey!
    
    Your personalized {{careerGoal}} roadmap is attached, including:
    - Essential skills to master
    - Learning timeline and resources
    - Salary expectations
    - Interview preparation guide
    
    Ready to accelerate your progress? Book a free 30-minute career consultation:
    {{bookingUrl}}
    
    Our experts have helped 10,000+ professionals land roles at top tech companies.
    
    Best regards,
    The Scaler Career Team
  `;
}

async function generateResourceDeliveryEmail(lead) {
  // Generate personalized resource email based on lead's career goal
  return {
    subject: `📚 Advanced ${lead.careerGoal} Resources for ${lead.firstName}`,
    html: `<p>Hi ${lead.firstName}, here are some advanced resources...</p>`,
    text: `Hi ${lead.firstName}, here are some advanced resources...`
  };
}

async function generateSocialProofEmail(lead) {
  return {
    subject: `How ${lead.firstName} Can Follow in These Footsteps: Success Stories`,
    html: `<p>Hi ${lead.firstName}, check out these inspiring success stories...</p>`,
    text: `Hi ${lead.firstName}, check out these inspiring success stories...`
  };
}

async function generateBookingReminderEmail(lead) {
  return {
    subject: `${lead.firstName}, Your Free Career Consultation is Still Available`,
    html: `<p>Hi ${lead.firstName}, don't miss your chance to speak with an expert...</p>`,
    text: `Hi ${lead.firstName}, don't miss your chance to speak with an expert...`
  };
}

async function generateFinalOfferEmail(lead) {
  return {
    subject: `Last Call: Your Career Breakthrough Awaits, ${lead.firstName}`,
    html: `<p>Hi ${lead.firstName}, this is your final opportunity...</p>`,
    text: `Hi ${lead.firstName}, this is your final opportunity...`
  };
}

module.exports = router;
