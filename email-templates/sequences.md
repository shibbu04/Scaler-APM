# Email Templates for Lead Conversion Funnel

## Template 1: Welcome Email with Career Roadmap

### Subject Line Options:
- 🚀 Your Data Engineering Roadmap is Here, {{firstName}}!
- {{firstName}}, Your Career Transformation Starts Now
- Welcome to Your Tech Journey, {{firstName}}! (Roadmap Inside)

### HTML Template:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Scaler Academy</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                🚀 Welcome to Your Journey!
            </h1>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Hi {{firstName}},</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
                I'm thrilled you've taken the first step toward accelerating your {{careerGoal}} career! 
                This is exactly the kind of proactive thinking that separates successful career changers 
                from those who just dream about it.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 30px;">
                As promised, here's your personalized career roadmap:
            </p>
            
            <!-- Roadmap Box -->
            <div style="background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 25px; margin: 30px 0; border-radius: 8px;">
                <h3 style="color: #1e293b; margin-top: 0; margin-bottom: 15px;">
                    🎯 Your {{careerGoal|title}} Success Roadmap
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #475569;">
                    <li style="margin-bottom: 8px;">✅ Essential skills and technologies to master</li>
                    <li style="margin-bottom: 8px;">✅ Step-by-step learning timeline (6-12 months)</li>
                    <li style="margin-bottom: 8px;">✅ Salary expectations and career progression</li>
                    <li style="margin-bottom: 8px;">✅ Interview preparation and portfolio tips</li>
                    <li style="margin-bottom: 8px;">✅ Top companies hiring in your field</li>
                </ul>
            </div>
            
            <!-- Download Button -->
            <div style="text-align: center; margin: 40px 0;">
                <a href="{{roadmapDownloadUrl}}" style="background: #10b981; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                    📥 Download Your Roadmap
                </a>
            </div>
            
            <!-- Social Proof -->
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px; text-align: center;">
                    <strong>💡 Did you know?</strong> Our students see an average salary increase of $45K 
                    within 12 months of completing their programs.
                </p>
            </div>
            
            <!-- CTA Section -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <h3 style="color: #1e293b; margin-top: 0;">Ready to Fast-Track Your Success?</h3>
                <p style="color: #64748b; margin-bottom: 25px;">
                    Our career experts have helped 10,000+ professionals land roles at companies like 
                    Google, Microsoft, and Amazon. Want to be next?
                </p>
                
                <a href="{{bookingUrl}}" style="background: #ef4444; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; margin-bottom: 15px;">
                    📞 Book Your FREE Career Consultation
                </a>
                
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    30-minute call • No cost • No obligation
                </p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #475569;">
                Looking forward to helping you achieve your career goals!
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #475569;">
                Best regards,<br>
                <strong>The Scaler Career Team</strong>
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #1e293b; padding: 30px; text-align: center;">
            <img src="{{logoUrl}}" alt="Scaler Academy" style="height: 40px; margin-bottom: 15px;">
            <p style="color: #94a3b8; font-size: 14px; margin: 0;">
                Scaler Academy | Building the next generation of tech leaders
            </p>
            <p style="color: #64748b; font-size: 12px; margin: 15px 0 0 0;">
                <a href="{{unsubscribeUrl}}" style="color: #64748b;">Unsubscribe</a> | 
                <a href="{{preferencesUrl}}" style="color: #64748b;">Update Preferences</a>
            </p>
        </div>
    </div>
    
    <!-- Tracking Pixel -->
    <img src="{{trackingPixelUrl}}" width="1" height="1" style="display: none;">
</body>
</html>
```

## Template 2: Nurture Email - Success Stories

### Subject: How {{firstName}} Can Follow These Footsteps: Real Success Stories

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="padding: 40px 30px;">
            <h2 style="color: #1e293b;">Hi {{firstName}},</h2>
            
            <p style="color: #475569; line-height: 1.6;">
                Yesterday I shared your {{careerGoal}} roadmap. Today, I want to show you what's 
                possible when you follow that roadmap with the right support.
            </p>
            
            <p style="color: #475569; line-height: 1.6;">
                Here are three inspiring stories from our community:
            </p>
            
            <!-- Success Story 1 -->
            <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <img src="{{story1ImageUrl}}" alt="Sarah Chen" style="width: 60px; height: 60px; border-radius: 50%; margin-right: 15px;">
                    <div>
                        <h4 style="margin: 0; color: #1e293b;">Sarah Chen</h4>
                        <p style="margin: 0; color: #64748b; font-size: 14px;">Marketing Manager → Data Engineer at Google</p>
                    </div>
                </div>
                <blockquote style="font-style: italic; color: #374151; margin: 20px 0; padding-left: 20px; border-left: 3px solid #3b82f6;">
                    "I was stuck in marketing for 6 years, dreaming of a tech career. Scaler's program gave me 
                    the structure, mentorship, and confidence I needed. Now I'm building data pipelines at Google!"
                </blockquote>
                <div style="background: #dcfce7; padding: 10px 15px; border-radius: 20px; display: inline-block;">
                    <span style="color: #166534; font-size: 14px; font-weight: 600;">
                        💰 $85K → $160K salary jump in 10 months
                    </span>
                </div>
            </div>
            
            <!-- Success Story 2 -->
            <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <img src="{{story2ImageUrl}}" alt="Raj Patel" style="width: 60px; height: 60px; border-radius: 50%; margin-right: 15px;">
                    <div>
                        <h4 style="margin: 0; color: #1e293b;">Raj Patel</h4>
                        <p style="margin: 0; color: #64748b; font-size: 14px;">High School Teacher → Software Engineer at Microsoft</p>
                    </div>
                </div>
                <blockquote style="font-style: italic; color: #374151; margin: 20px 0; padding-left: 20px; border-left: 3px solid #3b82f6;">
                    "At 35, I thought it was too late to switch careers. Scaler proved me wrong. The hands-on 
                    projects and career coaching were game-changers. Best decision I ever made!"
                </blockquote>
                <div style="background: #dcfce7; padding: 10px 15px; border-radius: 20px; display: inline-block;">
                    <span style="color: #166534; font-size: 14px; font-weight: 600;">
                        💰 $55K → $135K salary transformation
                    </span>
                </div>
            </div>
            
            <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
                <h3 style="color: #92400e; margin-top: 0;">{{firstName}}, Your Story Could Be Next!</h3>
                <p style="color: #92400e; margin-bottom: 20px;">
                    These aren't outliers – they're the norm. 85% of our students land jobs within 6 months.
                </p>
                <a href="{{bookingUrl}}" style="background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                    Discuss Your Success Plan (Free Call)
                </a>
            </div>
            
            <p style="color: #475569;">
                Ready to write your own success story?
            </p>
            
            <p style="color: #475569;">
                Best,<br>
                <strong>Priya Sharma</strong><br>
                Career Success Manager, Scaler Academy
            </p>
        </div>
    </div>
    <img src="{{trackingPixelUrl}}" width="1" height="1" style="display: none;">
</body>
</html>
```

## Template 3: Booking Reminder Email

### Subject: {{firstName}}, Your Free Career Consultation Slots Are Filling Up

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background: white;">
        <div style="padding: 30px;">
            <h2 style="color: #1e293b;">Hi {{firstName}},</h2>
            
            <p style="color: #475569; line-height: 1.6;">
                I noticed you downloaded your {{careerGoal}} roadmap but haven't booked your free 
                consultation yet. I want to make sure you don't miss this opportunity.
            </p>
            
            <div style="background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <p style="color: #991b1b; margin: 0; font-weight: 600;">
                    ⏰ Only 3 slots left this week!
                </p>
            </div>
            
            <p style="color: #475569; line-height: 1.6;">
                Here's what you'll get in your <strong>free 30-minute call</strong>:
            </p>
            
            <ul style="color: #475569; line-height: 1.8;">
                <li>✅ Personalized career transition plan</li>
                <li>✅ Skills gap analysis for your target role</li>
                <li>✅ Salary negotiation strategies</li>
                <li>✅ Job market insights and opportunities</li>
                <li>✅ Next steps to accelerate your progress</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{bookingUrl}}" style="background: #dc2626; color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                    Book My Free Consultation Now
                </a>
                <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0 0;">
                    No cost • No obligation • 30 minutes
                </p>
            </div>
            
            <p style="color: #475569; font-size: 14px; font-style: italic;">
                "The best time to plant a tree was 20 years ago. The second best time is now." 
                – Don't let another week pass wondering "what if."
            </p>
            
            <p style="color: #475569;">
                Talk soon,<br>
                <strong>The Scaler Team</strong>
            </p>
        </div>
    </div>
</body>
</html>
```

## Template 4: Final Offer Email

### Subject: Last Call: Your Career Breakthrough Awaits, {{firstName}}

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background: white;">
        <div style="padding: 30px;">
            <h2 style="color: #1e293b;">{{firstName}}, this is it.</h2>
            
            <p style="color: #475569; line-height: 1.6;">
                Over the past week, I've shared:
            </p>
            
            <ul style="color: #475569;">
                <li>Your personalized {{careerGoal}} roadmap</li>
                <li>Success stories from people just like you</li>
                <li>Multiple opportunities to speak with our experts</li>
            </ul>
            
            <p style="color: #475569; line-height: 1.6;">
                But I haven't heard back from you.
            </p>
            
            <p style="color: #475569; line-height: 1.6;">
                I get it. Career change is scary. It's easier to stay comfortable than to take the leap.
            </p>
            
            <p style="color: #475569; line-height: 1.6;">
                But here's what I know: <strong>A year from now, you'll wish you had started today.</strong>
            </p>
            
            <div style="background: #1e293b; color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
                <h3 style="margin-top: 0; color: white;">This Is Your Final Opportunity</h3>
                <p style="margin-bottom: 25px;">
                    Book your free consultation in the next 24 hours, or I'll assume you're not serious 
                    about transforming your career.
                </p>
                <a href="{{bookingUrl}}" style="background: #ef4444; color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                    Yes, I'm Ready to Transform My Career
                </a>
            </div>
            
            <p style="color: #475569; line-height: 1.6;">
                If you don't take action now, when will you?
            </p>
            
            <p style="color: #475569; line-height: 1.6;">
                When you're 65, looking back on your career, will you regret the chances you didn't take?
            </p>
            
            <p style="color: #475569; line-height: 1.6;">
                The choice is yours, {{firstName}}.
            </p>
            
            <p style="color: #475569;">
                Final call,<br>
                <strong>Scaler Career Team</strong>
            </p>
            
            <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
                <p style="color: #9ca3af; font-size: 12px;">
                    If you no longer want to receive emails about career opportunities, 
                    <a href="{{unsubscribeUrl}}" style="color: #9ca3af;">click here to unsubscribe</a>.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
```

## Template 5: Post-Booking Confirmation

### Subject: ✅ Your Career Consultation is Confirmed, {{firstName}}!

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background: white;">
        <div style="background: #10b981; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🎉 You're All Set!</h1>
        </div>
        
        <div style="padding: 30px;">
            <h2 style="color: #1e293b;">Hi {{firstName}},</h2>
            
            <p style="color: #475569; line-height: 1.6;">
                Excellent! Your free career consultation is confirmed. I'm excited to help you 
                create a clear path to your {{careerGoal}} goals.
            </p>
            
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #0c4a6e; margin-top: 0;">📅 Your Booking Details</h3>
                <p style="color: #0c4a6e; margin: 0;"><strong>Date:</strong> {{appointmentDate}}</p>
                <p style="color: #0c4a6e; margin: 0;"><strong>Time:</strong> {{appointmentTime}} {{timezone}}</p>
                <p style="color: #0c4a6e; margin: 0;"><strong>Duration:</strong> 30 minutes</p>
                <p style="color: #0c4a6e; margin: 0;"><strong>Meeting Link:</strong> <a href="{{meetingUrl}}">Join Meeting</a></p>
            </div>
            
            <h3 style="color: #1e293b;">What to Expect:</h3>
            <ul style="color: #475569; line-height: 1.8;">
                <li>🎯 We'll review your career goals and timeline</li>
                <li>📊 Identify the skills gap you need to bridge</li>
                <li>💼 Discuss salary expectations and market opportunities</li>
                <li>🚀 Create a step-by-step action plan</li>
                <li>❓ Answer all your questions about career transition</li>
            </ul>
            
            <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h4 style="color: #92400e; margin-top: 0;">🔥 Pro Tip:</h4>
                <p style="color: #92400e; margin: 0;">
                    Come prepared with specific questions about your transition. 
                    The more specific you are, the more value you'll get from our time together!
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{calendarUrl}}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">
                    📅 Add to Calendar
                </a>
                <a href="{{rescheduleUrl}}" style="background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    🔄 Reschedule
                </a>
            </div>
            
            <p style="color: #475569;">
                Looking forward to our chat!
            </p>
            
            <p style="color: #475569;">
                Best regards,<br>
                <strong>{{expertName}}</strong><br>
                Senior Career Coach, Scaler Academy
            </p>
        </div>
    </div>
</body>
</html>
```

## SMS Templates

### SMS 1: Booking Reminder (24h before)
```
Hi {{firstName}}! Reminder: Your free career consultation is tomorrow at {{appointmentTime}}. 

Meeting link: {{shortMeetingUrl}}

Can't wait to help you plan your {{careerGoal}} journey! 

- Scaler Team
```

### SMS 2: Booking Reminder (1h before)
```
{{firstName}}, your career consultation starts in 1 hour! 

Join here: {{shortMeetingUrl}}

See you soon! 🚀

- {{expertName}}
```

## Email Personalization Variables

```json
{
  "firstName": "Lead's first name",
  "lastName": "Lead's last name", 
  "email": "Lead's email address",
  "careerGoal": "data-engineering|software-engineering|ai-ml",
  "currentRole": "Lead's current job title",
  "company": "Lead's current company",
  "experienceLevel": "beginner|intermediate|advanced",
  "leadScore": "Numerical lead score 0-100",
  "source": "blog|social|paid-ad|referral",
  "bookingUrl": "Calendly booking link",
  "roadmapDownloadUrl": "PDF download link",
  "trackingPixelUrl": "Email tracking pixel",
  "unsubscribeUrl": "One-click unsubscribe link",
  "preferencesUrl": "Email preferences page",
  "appointmentDate": "Formatted appointment date",
  "appointmentTime": "Formatted appointment time",
  "timezone": "Lead's timezone",
  "meetingUrl": "Video call link",
  "expertName": "Assigned career expert name"
}
```

## A/B Testing Variations

### Subject Line Tests:
- Urgency: "Only 24 hours left, {{firstName}}"
- Benefit: "{{firstName}}, your $50K salary increase starts here"
- Personal: "{{firstName}}, I have something for you"
- Question: "{{firstName}}, ready for your dream job?"

### CTA Button Tests:
- "Book My Free Call"
- "Claim My Consultation" 
- "Get My Career Plan"
- "Start My Transformation"
- "Unlock My Potential"

### Send Time Tests:
- Tuesday 10 AM
- Wednesday 2 PM  
- Thursday 9 AM
- Friday 11 AM
