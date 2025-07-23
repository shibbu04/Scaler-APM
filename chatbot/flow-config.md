# Chatbot Flow Configuration

This document defines the conversational flows for the AI career assistant chatbot.

## Flow Architecture

```
Start
├── Greeting Flow
├── Career Goal Collection
├── Lead Qualification
├── Resource Offering  
├── Booking Flow
└── Objection Handling
```

## Core Flows

### 1. Greeting Flow

**Trigger:** User opens chatbot or says hello
**Goal:** Welcome user and identify their main career objective

```yaml
greeting:
  trigger: ["hi", "hello", "hey", "start", "help"]
  responses:
    - "Hi there! 👋 I'm your AI career assistant. I help people like you land amazing tech jobs."
    - "Hello! 🚀 Ready to accelerate your tech career? I'm here to help you succeed."
    - "Hey! 💻 Looking to break into tech or level up your career? You're in the right place!"
  
  quick_replies:
    - "Learn Data Engineering"
    - "Switch to Tech Career" 
    - "Get Better Job"
    - "Assess My Skills"
  
  follow_up: "What brings you here today? I'd love to help you with your career goals!"
```

### 2. Career Goal Collection Flow

**Trigger:** User expresses interest in specific career path
**Goal:** Understand their career aspirations and experience level

```yaml
career_goal_collection:
  data_engineering:
    trigger: ["data engineer", "data engineering", "data science", "analytics"]
    response: "Excellent choice! Data Engineering is one of the fastest-growing fields with average salaries of $130K+. Tell me, what's your current background?"
    quick_replies:
      - "Complete Beginner"
      - "Some Tech Experience"
      - "Non-Tech Professional"
      - "Already in Analytics"
    next_flow: "experience_assessment"
  
  software_engineering:
    trigger: ["software engineer", "developer", "programming", "coding"]
    response: "Great! Software Engineering offers incredible opportunities across all industries. What's your experience with coding?"
    quick_replies:
      - "Never Coded Before"
      - "Self-Taught Basics"
      - "Bootcamp Graduate"
      - "Different Tech Role"
    next_flow: "experience_assessment"
  
  ai_ml:
    trigger: ["AI", "machine learning", "artificial intelligence", "ML"]
    response: "Fantastic! AI/ML is revolutionizing every industry. With average salaries of $150K+, it's a great field. What's your math/stats background?"
    quick_replies:
      - "Strong Math Background"
      - "Some Statistics"  
      - "Business/Analytics"
      - "Complete Beginner"
    next_flow: "experience_assessment"
```

### 3. Experience Assessment Flow

**Goal:** Determine current skill level and create personalized recommendations

```yaml
experience_assessment:
  beginner:
    response: "Perfect! Everyone starts somewhere. The great news is that companies are hiring entry-level talent more than ever. Here's what I recommend for your journey..."
    actions:
      - offer_beginner_roadmap
      - collect_contact_info
    
  intermediate:
    response: "Awesome! Having some foundation makes your transition much smoother. You're probably 6-12 months away from landing your target role. Let me share the exact path..."
    actions:
      - offer_intermediate_roadmap
      - suggest_skill_gap_analysis
    
  advanced:
    response: "Excellent! With your background, you could be job-ready in 3-6 months with the right strategy. Let's talk about optimizing your approach..."
    actions:
      - offer_advanced_strategy
      - suggest_portfolio_review
```

### 4. Lead Qualification Flow

**Goal:** Gather contact information and assess fit for programs

```yaml
lead_qualification:
  email_collection:
    trigger: "offer_roadmap"
    response: "I'd love to send you a personalized roadmap! What's your email address?"
    validation: email_format
    next_flow: "name_collection"
  
  name_collection:
    response: "Thanks! And what should I call you?"
    next_flow: "phone_collection"
  
  phone_collection:
    response: "Perfect, {name}! One last thing - what's your phone number? (This helps our experts reach you for any follow-up)"
    optional: true
    next_flow: "current_situation"
  
  current_situation:
    response: "Got it! Tell me about your current work situation. What do you do now?"
    capture: ["current_role", "company", "industry"]
    next_flow: "timeline_assessment"
  
  timeline_assessment:
    response: "And when are you hoping to make this career transition?"
    quick_replies:
      - "As soon as possible"
      - "Within 6 months"
      - "Within a year"
      - "Just exploring"
    next_flow: "resource_delivery"
```

### 5. Resource Delivery Flow

**Goal:** Provide value and move towards booking consultation

```yaml
resource_delivery:
  roadmap_delivery:
    response: "Fantastic! I'm sending your personalized {career_goal} roadmap to {email} right now. You should see it in your inbox within 2 minutes."
    actions:
      - send_email_roadmap
      - update_lead_stage: "warm"
    follow_up: "While you're here, {name}, I have something even better for you..."
  
  consultation_offer:
    response: "Our senior career experts are offering FREE 30-minute strategy sessions this week. They've helped 10,000+ people land roles at Google, Microsoft, Amazon, and other top companies."
    value_props:
      - "Personalized career transition plan"
      - "Skills gap analysis"
      - "Salary negotiation strategies"  
      - "Hidden job market insights"
      - "Interview preparation tips"
    
    quick_replies:
      - "Yes, book my call!"
      - "Tell me more"
      - "Maybe later"
    
    responses:
      yes: "Excellent choice! Let me connect you with our booking system..."
      more_info: "These aren't generic calls. Each session is tailored to your background and goals..."
      maybe_later: "I understand! How about I follow up with you in a few days with some additional resources?"
```

### 6. Booking Flow

**Goal:** Convert interested leads to scheduled consultations

```yaml
booking_flow:
  booking_initiation:
    response: "Perfect! I'm opening our calendar for you. Our experts have availability this week and next."
    actions:
      - show_calendly_widget
      - track_booking_intent
  
  booking_assistance:
    response: "Having trouble with the calendar? I can help you find the perfect time slot. When works best for you?"
    quick_replies:
      - "This week morning"
      - "This week afternoon"  
      - "Next week morning"
      - "Next week afternoon"
      - "Evenings only"
  
  booking_confirmation:
    trigger: "booking_completed"
    response: "🎉 Awesome! Your consultation is confirmed for {appointment_time}. You'll receive a confirmation email with all the details."
    follow_up: "Our expert will call you at {phone_number}. If anything changes, just reply to the confirmation email!"
    actions:
      - update_lead_stage: "hot"
      - send_booking_confirmation
      - notify_sales_team
```

### 7. Objection Handling Flow

**Goal:** Address common concerns and hesitations

```yaml
objection_handling:
  too_expensive:
    trigger: ["expensive", "costly", "money", "afford", "price"]
    response: "I completely understand! The great news is that this consultation is completely FREE. No cost, no obligation. Think of it as an investment in your future - our students see average salary increases of $45K within a year."
    
  not_ready:
    trigger: ["not ready", "later", "thinking", "maybe"]
    response: "That's totally fine! Career change is a big decision. How about this - grab your free roadmap now, and when you're ready to take the next step, you'll have a clear path forward. Sound good?"
    
  time_concerns:
    trigger: ["busy", "no time", "schedule"]
    response: "I hear you! That's exactly why successful people work with mentors - to avoid wasting time on the wrong things. This 30-minute call could save you months of trial and error. Worth it?"
    
  skepticism:
    trigger: ["scam", "doubt", "sure", "really work"]
    response: "Your skepticism is healthy! We've helped 10,000+ people transition to tech - check out our success stories. This consultation is free because we want to prove our value upfront. What do you have to lose?"
```

### 8. Advanced Intent Detection

```yaml
intent_detection:
  salary_inquiry:
    trigger: ["salary", "pay", "money", "earn", "income"]
    response: "Great question! Here are typical salary ranges:\n• Data Engineers: $95K-$180K\n• Software Engineers: $85K-$170K\n• AI/ML Engineers: $110K-$200K\n\nYour actual salary depends on location, experience, and company. Want to discuss your specific situation?"
  
  company_interest:
    trigger: ["Google", "Microsoft", "Amazon", "Facebook", "Netflix", "FAANG"]
    response: "Excellent goal! Our students work at all these companies. Getting hired at top tech companies requires specific preparation - the right skills, projects, and interview prep. Our experts know exactly what these companies look for. Interested in learning their strategies?"
  
  timeline_urgency:
    trigger: ["quickly", "fast", "urgent", "ASAP", "soon"]
    response: "I love the urgency! With focused effort, you could be job-ready in 3-6 months depending on your background. The key is having a clear roadmap and expert guidance. Want to discuss an accelerated path?"
  
  location_concerns:
    trigger: ["remote", "location", "move", "relocate"]
    response: "Great news! 70% of tech jobs are now remote-friendly. You can work for Silicon Valley companies from anywhere. Our career experts know which companies are most remote-friendly and how to position yourself for remote roles."
```

## Conversation Context Management

### Context Variables
```javascript
{
  "sessionId": "unique_session_identifier",
  "userId": "user_identifier_if_known",
  "currentFlow": "active_conversation_flow",
  "collectedData": {
    "name": "user_name",
    "email": "user_email", 
    "phone": "user_phone",
    "careerGoal": "target_career",
    "currentRole": "existing_job",
    "experienceLevel": "skill_level",
    "timeline": "transition_timeline",
    "concerns": ["list_of_concerns"]
  },
  "leadScore": "calculated_score_0_100",
  "nextAction": "recommended_next_step",
  "lastInteraction": "timestamp",
  "source": "traffic_source",
  "utmParams": "tracking_parameters"
}
```

### Conversation Memory
- Remember user's name throughout session
- Track previously discussed topics
- Avoid repeating information
- Personalize responses based on collected data
- Maintain conversation flow continuity

## Response Personalization

### Dynamic Content Insertion
```javascript
// Example personalized responses
const responses = {
  withName: "That's a great question, {name}! Here's what I recommend...",
  withCareer: "For {careerGoal}, the typical path is...",
  withExperience: "Given your {experienceLevel} background, I'd suggest...",
  withTimeline: "Since you want to transition {timeline}, here's an accelerated approach..."
};
```

### Conditional Logic
```yaml
if_conditions:
  experienced_developer:
    condition: "currentRole contains ['developer', 'engineer', 'programmer']"
    response: "With your coding background, you're already ahead of the game!"
    
  career_changer:
    condition: "currentRole not contains ['tech', 'engineer', 'developer']"
    response: "Career change can feel overwhelming, but you're not alone! 60% of our students come from non-tech backgrounds."
    
  urgent_timeline:
    condition: "timeline equals 'ASAP'"
    response: "I love the urgency! Let's create an aggressive timeline that works."
```

## Fallback Handling

### Unknown Intent
```yaml
fallback_responses:
  - "I'm not sure I understand. Could you rephrase that?"
  - "Interesting question! Can you tell me more about what you're looking for?"
  - "Let me connect you with a human expert who can better help with that specific question."
```

### Error Recovery  
```yaml
error_recovery:
  invalid_email:
    response: "That doesn't look like a valid email address. Could you double-check it for me?"
    retry_limit: 3
    
  connection_issues:
    response: "Sorry, I'm having technical difficulties. Let me try that again..."
    fallback_action: "escalate_to_human"
```

## Performance Metrics

### Key Metrics to Track
- Conversation completion rate
- Email capture rate  
- Booking conversion rate
- Average conversation length
- Most common exit points
- User satisfaction scores

### A/B Testing Framework
- Test different greeting messages
- Vary value propositions
- Test different CTA approaches
- Experiment with response timing
- Test personality variations (formal vs casual)
