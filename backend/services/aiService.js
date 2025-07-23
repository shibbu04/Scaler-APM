const axios = require('axios');

class AIService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
  }

  async generatePersonalizedResponse(message, intent, lead) {
    try {
      const context = this.buildLeadContext(lead);
      const prompt = this.buildResponsePrompt(message, intent, context);

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user', 
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      
      // Determine actions based on intent
      const actions = this.determineActions(intent, lead);

      return {
        text: aiResponse,
        actions,
        intent,
        confidence: 0.85 // Mock confidence score
      };

    } catch (error) {
      console.error('AI response generation error:', error);
      
      // Fallback to predefined responses
      return this.getFallbackResponse(intent, lead);
    }
  }

  async generatePersonalizedEmail(template, lead) {
    try {
      const context = this.buildLeadContext(lead);
      const prompt = `
        Personalize this email template for a lead with the following context:
        ${context}
        
        Template:
        ${template.html || template.text}
        
        Make it feel personal and relevant to their career goals. Keep the same structure but customize the content.
        Return only the personalized email content.
      `;

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert email marketer specializing in EdTech and career development. Create personalized, engaging emails that convert.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 800,
          temperature: 0.6
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const personalizedContent = response.data.choices[0].message.content;

      return {
        subject: template.subject.replace('{{firstName}}', lead.firstName),
        html: personalizedContent,
        text: this.stripHtml(personalizedContent)
      };

    } catch (error) {
      console.error('Email personalization error:', error);
      
      // Return original template with basic substitutions
      return {
        subject: template.subject.replace('{{firstName}}', lead.firstName),
        html: template.html?.replace(/{{firstName}}/g, lead.firstName)
                            ?.replace(/{{careerGoal}}/g, lead.careerGoal || 'tech career'),
        text: template.text?.replace(/{{firstName}}/g, lead.firstName)
                           ?.replace(/{{careerGoal}}/g, lead.careerGoal || 'tech career')
      };
    }
  }

  async analyzeLeadPersonality(interactions) {
    try {
      const conversationText = interactions.map(i => i.message).join('\n');
      
      if (!conversationText.trim()) {
        return this.getDefaultPersonality();
      }

      const prompt = `
        Analyze this conversation and determine the person's:
        1. Communication style (formal, casual, technical)
        2. Preferred content type (video, text, interactive)
        3. Main pain points
        4. Key motivations
        
        Conversation:
        ${conversationText}
        
        Return as JSON with keys: communicationStyle, preferredContent, painPoints, motivations
      `;

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a behavioral analyst. Analyze conversations to understand personality and preferences. Return valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 200,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const analysis = JSON.parse(response.data.choices[0].message.content);
      return analysis;

    } catch (error) {
      console.error('Personality analysis error:', error);
      return this.getDefaultPersonality();
    }
  }

  async generateFollowUpSuggestions(lead) {
    try {
      const context = this.buildLeadContext(lead);
      
      const prompt = `
        Based on this lead's profile, suggest 3 personalized follow-up actions:
        ${context}
        
        Consider their stage, engagement level, and interests.
        Return as JSON array with objects containing: action, message, timing, priority
      `;

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system', 
              content: 'You are a sales automation expert. Generate actionable follow-up suggestions. Return valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.6
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return JSON.parse(response.data.choices[0].message.content);

    } catch (error) {
      console.error('Follow-up suggestions error:', error);
      return this.getDefaultFollowUpSuggestions(lead);
    }
  }

  buildLeadContext(lead) {
    if (!lead) return 'New lead with minimal information.';

    return `
      Name: ${lead.firstName} ${lead.lastName || ''}
      Email: ${lead.email}
      Career Goal: ${lead.careerGoal || 'Not specified'}
      Experience Level: ${lead.experienceLevel || 'Not specified'}
      Current Role: ${lead.currentRole || 'Not specified'}
      Company: ${lead.company || 'Not specified'}
      Stage: ${lead.stage}
      Lead Score: ${lead.leadScore}
      Source: ${lead.source}
      Chatbot Interactions: ${lead.chatbotInteractions?.length || 0}
      Email Engagement: ${lead.emailEngagement?.opened || 0} opens, ${lead.emailEngagement?.clicked || 0} clicks
      Call Scheduled: ${lead.callScheduled ? 'Yes' : 'No'}
      Call Completed: ${lead.callCompleted ? 'Yes' : 'No'}
    `;
  }

  buildResponsePrompt(message, intent, context) {
    return `
      User message: "${message}"
      Detected intent: ${intent}
      Lead context: ${context}
      
      Generate a helpful, personalized response that:
      1. Addresses their specific message
      2. Shows understanding of their career goals
      3. Provides value (insights, resources, next steps)
      4. Naturally guides them toward booking a consultation
      5. Maintains a friendly, professional tone
      
      Keep response under 150 words.
    `;
  }

  getSystemPrompt() {
    return `
      You are a helpful AI career advisor for Scaler Academy, specializing in tech career transitions.
      Your role is to:
      - Help people understand career paths in data engineering, software engineering, AI/ML
      - Provide valuable insights and resources
      - Guide qualified leads toward booking a consultation
      - Be personable, knowledgeable, and results-focused
      
      Key facts about Scaler:
      - Helped 10,000+ professionals transition to tech
      - Graduates work at Google, Microsoft, Amazon, etc.
      - Offers comprehensive courses in various tech domains
      - Provides career support and job placement assistance
      
      Always be helpful, never pushy, and focus on providing genuine value.
    `;
  }

  determineActions(intent, lead) {
    const actions = [];

    switch (intent) {
      case 'course_interest':
        actions.push({
          type: 'offer_resource',
          data: { resourceType: 'course_catalog' }
        });
        if (lead?.stage === 'warm') {
          actions.push({
            type: 'suggest_consultation',
            data: { urgency: 'medium' }
          });
        }
        break;

      case 'booking_intent':
        actions.push({
          type: 'show_calendar',
          data: { direct: true }
        });
        break;

      case 'pricing_inquiry':
        actions.push({
          type: 'offer_consultation',
          data: { reason: 'discuss_pricing' }
        });
        break;

      case 'career_guidance':
        actions.push({
          type: 'offer_resource',
          data: { resourceType: 'career_roadmap' }
        });
        actions.push({
          type: 'collect_info',
          data: { fields: ['careerGoal', 'experienceLevel'] }
        });
        break;

      default:
        if (lead?.leadScore < 30) {
          actions.push({
            type: 'collect_info',
            data: { fields: ['firstName', 'careerGoal'] }
          });
        }
    }

    return actions;
  }

  getFallbackResponse(intent, lead) {
    const responses = {
      'data_engineering_interest': {
        text: `That's awesome! Data Engineering is one of the fastest-growing fields in tech. ${lead?.firstName ? lead.firstName + ', ' : ''}I'd love to share our complete Data Engineering roadmap with you. Would you like me to send it to your email?`,
        actions: [
          { type: 'offer_resource', data: { resourceType: 'data_engineering_roadmap' } },
          { type: 'collect_email', data: {} }
        ]
      },
      'software_engineering_interest': {
        text: `Excellent choice! Software Engineering offers incredible opportunities. ${lead?.firstName ? lead.firstName + ', ' : ''}let me share some resources that can help you get started. What's your current experience level?`,
        actions: [
          { type: 'collect_info', data: { fields: ['experienceLevel'] } },
          { type: 'offer_resource', data: { resourceType: 'swe_guide' } }
        ]
      },
      'booking_intent': {
        text: `I'd be happy to connect you with one of our career experts! ${lead?.firstName ? lead.firstName + ', ' : ''}they've helped thousands of professionals land their dream tech jobs. Let me show you available time slots.`,
        actions: [
          { type: 'show_calendar', data: { direct: true } }
        ]
      },
      'general_inquiry': {
        text: `Thanks for reaching out! I'm here to help you accelerate your tech career. ${lead?.firstName ? lead.firstName + ', ' : ''}what specific area are you most interested in learning about?`,
        actions: [
          { type: 'show_options', data: { options: ['Data Engineering', 'Software Engineering', 'AI/ML', 'Career Consultation'] } }
        ]
      }
    };

    return responses[intent] || responses['general_inquiry'];
  }

  getDefaultPersonality() {
    return {
      communicationStyle: 'casual',
      preferredContent: ['text', 'interactive'],
      painPoints: ['career_transition', 'skill_gap'],
      motivations: ['career_growth', 'better_salary']
    };
  }

  getDefaultFollowUpSuggestions(lead) {
    return [
      {
        action: 'send_resource',
        message: `Send career roadmap for ${lead?.careerGoal || 'tech career'}`,
        timing: 'immediate',
        priority: 'high'
      },
      {
        action: 'schedule_call',
        message: 'Offer free career consultation',
        timing: '1 day',
        priority: 'medium'
      },
      {
        action: 'social_proof',
        message: 'Share success stories from similar background',
        timing: '3 days',
        priority: 'low'
      }
    ];
  }

  stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

// Export functions for use in routes
const aiService = new AIService();

module.exports = {
  generatePersonalizedResponse: (message, intent, lead) => 
    aiService.generatePersonalizedResponse(message, intent, lead),
  
  generatePersonalizedEmail: (template, lead) => 
    aiService.generatePersonalizedEmail(template, lead),
  
  analyzeLeadPersonality: (interactions) => 
    aiService.analyzeLeadPersonality(interactions),
  
  generateFollowUpSuggestions: (lead) => 
    aiService.generateFollowUpSuggestions(lead)
};
