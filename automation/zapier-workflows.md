# Zapier Automation Workflows

This document outlines the Zapier automation workflows that power the lead conversion funnel.

## Workflow 1: New Lead Welcome Sequence
**Trigger:** Webhook from `/api/leads` (POST)
**Actions:**
1. Add to Mailchimp list with tags
2. Send welcome email with career roadmap
3. Create task in project management tool
4. Send Slack notification to sales team

### Webhook Configuration
```
Endpoint: https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID/new-lead
Method: POST
Headers: 
  Content-Type: application/json
  X-Zapier-Auth: YOUR_AUTH_TOKEN
```

### Sample Payload
```json
{
  "leadId": "507f1f77bcf86cd799439011",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "careerGoal": "data-engineering",
  "source": "blog",
  "utmSource": "google",
  "utmMedium": "cpc",
  "utmCampaign": "data-career-2024",
  "leadScore": 65,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Workflow 2: Booking Notifications
**Trigger:** Webhook from `/api/booking/schedule` (POST)
**Actions:**
1. Send calendar invite to expert
2. Add lead info to CRM
3. Send confirmation SMS to lead
4. Create Google Meet link
5. Send reminder emails (24h, 1h before)

### Booking Webhook Payload
```json
{
  "bookingId": "booking_123456",
  "leadId": "507f1f77bcf86cd799439011",
  "leadName": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "scheduledTime": "2024-01-20T15:00:00Z",
  "timezone": "America/New_York",
  "careerGoal": "data-engineering",
  "leadScore": 75,
  "additionalQuestions": {
    "currentRole": "Marketing Analyst",
    "company": "Tech Corp",
    "experience": "2 years"
  }
}
```

## Workflow 3: Email Engagement Tracking
**Trigger:** Webhook from email opens/clicks
**Actions:**
1. Update lead score in database
2. Trigger follow-up sequences based on engagement
3. Notify sales team of high-engagement leads
4. Personalize future email content

### Email Tracking Webhook
```json
{
  "event": "email_opened",
  "email": "john.doe@example.com",
  "campaignId": "welcome_sequence_1",
  "timestamp": "2024-01-16T09:15:00Z",
  "leadId": "507f1f77bcf86cd799439011"
}
```

## Workflow 4: Chatbot Lead Qualification
**Trigger:** Webhook from chatbot interactions
**Actions:**
1. Analyze conversation for buying intent
2. Score lead based on responses
3. Route hot leads to sales team
4. Trigger personalized email sequences

### Chatbot Webhook Payload
```json
{
  "sessionId": "chat_abc123",
  "leadId": "507f1f77bcf86cd799439011",
  "email": "john.doe@example.com",
  "interactions": [
    {
      "message": "I want to become a data engineer",
      "intent": "data_engineering_interest",
      "timestamp": "2024-01-16T14:30:00Z"
    }
  ],
  "qualificationScore": 85,
  "nextAction": "book_consultation"
}
```

## Workflow 5: Course Purchase Flow
**Trigger:** Webhook from successful course purchase
**Actions:**
1. Send purchase confirmation email
2. Grant course access
3. Add to student Slack community
4. Schedule onboarding call
5. Update CRM with purchase data

### Purchase Webhook Payload
```json
{
  "purchaseId": "purchase_789012",
  "leadId": "507f1f77bcf86cd799439011",
  "email": "john.doe@example.com",
  "courseId": "data-engineering-12-month",
  "amount": 2999,
  "currency": "USD",
  "paymentMethod": "credit_card",
  "timestamp": "2024-01-25T16:45:00Z"
}
```

## Workflow 6: Re-engagement Campaign
**Trigger:** Daily scheduled task
**Actions:**
1. Find leads inactive for 7+ days
2. Send personalized re-engagement email
3. Offer limited-time discount
4. Track responses and book follow-up calls

### Re-engagement Logic
```python
# Zapier Code Step Example
import datetime

def find_inactive_leads():
    # Find leads who haven't engaged in 7 days
    cutoff_date = datetime.datetime.now() - datetime.timedelta(days=7)
    
    inactive_leads = [
        lead for lead in all_leads 
        if lead['lastEngagement'] < cutoff_date 
        and lead['stage'] in ['warm', 'cold']
        and lead['leadScore'] > 50
    ]
    
    return inactive_leads[:50]  # Limit to 50 leads per day
```

## Setup Instructions

### 1. Create Zapier Account
- Sign up at zapier.com
- Choose the Professional plan for unlimited webhooks

### 2. Set Up Webhooks
1. Create new Zap
2. Choose "Webhooks by Zapier" as trigger
3. Select "Catch Hook"
4. Copy webhook URL to environment variable
5. Test with sample payload

### 3. Configure Integrations
- **Mailchimp:** Connect account, select list
- **Calendly:** Connect account, configure event types  
- **Slack:** Connect workspace, select channel
- **Google Calendar:** Connect account for calendar events
- **Twilio:** For SMS notifications (optional)

### 4. Environment Variables
Add these to your `.env` file:
```
ZAPIER_NEW_LEAD_WEBHOOK=https://hooks.zapier.com/hooks/catch/XXX/new-lead
ZAPIER_BOOKING_WEBHOOK=https://hooks.zapier.com/hooks/catch/XXX/booking
ZAPIER_EMAIL_WEBHOOK=https://hooks.zapier.com/hooks/catch/XXX/email-event
ZAPIER_CHATBOT_WEBHOOK=https://hooks.zapier.com/hooks/catch/XXX/chatbot
ZAPIER_PURCHASE_WEBHOOK=https://hooks.zapier.com/hooks/catch/XXX/purchase
```

### 5. Testing Workflows
1. Use Zapier's built-in testing tools
2. Send test webhooks from your application
3. Monitor Zapier task history for errors
4. Set up error notifications

## Monitoring and Optimization

### Key Metrics to Track
- Webhook delivery success rate
- Email open/click rates by sequence
- Booking completion rate
- Lead-to-customer conversion rate
- Average response time to hot leads

### Troubleshooting Common Issues
1. **Webhook Failures:** Check endpoint URLs and authentication
2. **Email Bounces:** Verify email addresses and sender reputation
3. **Calendar Conflicts:** Ensure proper timezone handling
4. **Rate Limiting:** Implement delays between actions

### Optimization Tips
1. A/B test email subject lines and content
2. Adjust lead scoring thresholds based on conversion data
3. Personalize messaging based on lead source and behavior
4. Optimize timing of follow-up sequences
5. Monitor and improve email deliverability

## Cost Estimation
- Zapier Professional: $49/month
- Mailchimp Essentials: $10/month (up to 500 contacts)
- Calendly Professional: $10/month
- Twilio SMS: ~$0.01 per message
- **Total:** ~$70/month for full automation stack
