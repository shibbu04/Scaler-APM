const express = require('express');
const router = express.Router();
const axios = require('axios');
const Lead = require('../models/Lead');

// POST /api/booking/schedule - Schedule a consultation call
router.post('/schedule', async (req, res) => {
  try {
    const {
      email,
      eventTypeUuid,
      startTime,
      endTime,
      timezone,
      guestName,
      guestEmail,
      additionalQuestions = {}
    } = req.body;

    // Find lead
    const lead = await Lead.findOne({ email: guestEmail || email });
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Create Calendly booking via API
    const bookingData = {
      event_type: eventTypeUuid,
      start_time: startTime,
      end_time: endTime,
      event_memberships: [{
        user: process.env.CALENDLY_USER_UUID
      }],
      invitees: [{
        email: guestEmail || email,
        name: guestName || lead.fullName
      }],
      questions_and_answers: Object.entries(additionalQuestions).map(([question, answer]) => ({
        question,
        answer
      }))
    };

    const calendlyResponse = await axios.post(
      'https://api.calendly.com/scheduled_events',
      bookingData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CALENDLY_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const eventUri = calendlyResponse.data.resource.uri;
    const eventId = eventUri.split('/').pop();

    // Update lead with booking information
    lead.bookingId = eventId;
    lead.callScheduled = new Date(startTime);
    lead.stage = 'hot';
    lead.lastTouchpoint = 'call-booked';
    
    // Store additional context from booking questions
    if (additionalQuestions.careerGoal) {
      lead.careerGoal = additionalQuestions.careerGoal;
    }
    if (additionalQuestions.currentRole) {
      lead.currentRole = additionalQuestions.currentRole;
    }
    if (additionalQuestions.company) {
      lead.company = additionalQuestions.company;
    }

    await lead.save();

    // Send confirmation email
    await sendBookingConfirmation(lead, {
      eventId,
      startTime,
      endTime,
      timezone
    });

    // Trigger internal notification to sales team
    await notifySalesTeam(lead, {
      eventId,
      startTime,
      timezone,
      additionalQuestions
    });

    res.json({
      message: 'Booking scheduled successfully',
      bookingId: eventId,
      scheduledTime: startTime,
      leadId: lead._id,
      confirmationSent: true
    });

  } catch (error) {
    console.error('Booking error:', error);
    if (error.response?.status === 401) {
      res.status(401).json({ error: 'Calendly authentication failed' });
    } else if (error.response?.status === 422) {
      res.status(422).json({ error: 'Invalid booking data or time slot unavailable' });
    } else {
      res.status(500).json({ error: 'Failed to schedule booking' });
    }
  }
});

// GET /api/booking/availability - Get available time slots
router.get('/availability', async (req, res) => {
  try {
    const { 
      eventType = process.env.CALENDLY_EVENT_TYPE,
      startDate,
      endDate 
    } = req.query;

    // Get availability from Calendly
    const response = await axios.get(
      `https://api.calendly.com/event_type_available_times`,
      {
        params: {
          event_type: eventType,
          start_time: startDate,
          end_time: endDate
        },
        headers: {
          'Authorization': `Bearer ${process.env.CALENDLY_API_TOKEN}`
        }
      }
    );

    const availableSlots = response.data.collection.map(slot => ({
      start: slot.start_time,
      end: slot.end_time,
      status: slot.status
    }));

    res.json({
      eventType,
      dateRange: { startDate, endDate },
      availableSlots,
      timezone: 'UTC'
    });

  } catch (error) {
    console.error('Availability fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// POST /api/booking/reschedule - Reschedule existing booking
router.post('/reschedule', async (req, res) => {
  try {
    const { 
      bookingId, 
      newStartTime, 
      newEndTime,
      reason 
    } = req.body;

    // Find lead with this booking
    const lead = await Lead.findOne({ bookingId });
    if (!lead) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Cancel existing Calendly event
    await axios.delete(
      `https://api.calendly.com/scheduled_events/${bookingId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CALENDLY_API_TOKEN}`
        }
      }
    );

    // Create new booking
    const newBookingResponse = await axios.post(
      'https://api.calendly.com/scheduled_events',
      {
        event_type: process.env.CALENDLY_EVENT_TYPE,
        start_time: newStartTime,
        end_time: newEndTime,
        invitees: [{
          email: lead.email,
          name: lead.fullName
        }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.CALENDLY_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const newEventId = newBookingResponse.data.resource.uri.split('/').pop();

    // Update lead
    lead.bookingId = newEventId;
    lead.callScheduled = new Date(newStartTime);
    lead.notes = `${lead.notes || ''}\nRescheduled: ${reason || 'No reason provided'}`;
    
    await lead.save();

    // Send reschedule confirmation
    await sendRescheduleConfirmation(lead, {
      oldTime: lead.callScheduled,
      newTime: newStartTime,
      reason
    });

    res.json({
      message: 'Booking rescheduled successfully',
      newBookingId: newEventId,
      newScheduledTime: newStartTime
    });

  } catch (error) {
    console.error('Reschedule error:', error);
    res.status(500).json({ error: 'Failed to reschedule booking' });
  }
});

// POST /api/booking/cancel - Cancel booking
router.post('/cancel', async (req, res) => {
  try {
    const { bookingId, reason } = req.body;

    // Find lead
    const lead = await Lead.findOne({ bookingId });
    if (!lead) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Cancel Calendly event
    await axios.delete(
      `https://api.calendly.com/scheduled_events/${bookingId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CALENDLY_API_TOKEN}`
        }
      }
    );

    // Update lead
    lead.bookingId = null;
    lead.callScheduled = null;
    lead.stage = 'warm'; // Move back to warm
    lead.notes = `${lead.notes || ''}\nCancelled: ${reason || 'No reason provided'}`;
    
    await lead.save();

    // Send cancellation email and offer to reschedule
    await sendCancellationEmail(lead, reason);

    res.json({
      message: 'Booking cancelled successfully',
      leadId: lead._id
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// POST /api/booking/complete - Mark call as completed
router.post('/complete', async (req, res) => {
  try {
    const { 
      bookingId, 
      callNotes, 
      outcome,
      nextSteps,
      courseInterest,
      followUpDate 
    } = req.body;

    const lead = await Lead.findOne({ bookingId });
    if (!lead) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Update lead with call completion data
    lead.callCompleted = true;
    lead.callNotes = callNotes;
    lead.lastTouchpoint = 'call-completed';
    
    // Update stage based on outcome
    if (outcome === 'interested' || courseInterest) {
      lead.stage = 'hot';
      lead.courseInterest = courseInterest;
    } else if (outcome === 'not-ready') {
      lead.stage = 'warm';
    } else if (outcome === 'not-interested') {
      lead.stage = 'churned';
    }

    // Add notes about next steps
    if (nextSteps) {
      lead.notes = `${lead.notes || ''}\nCall completed - Next steps: ${nextSteps}`;
    }

    await lead.save();

    // Send post-call follow-up email
    await sendPostCallFollowUp(lead, {
      outcome,
      nextSteps,
      courseInterest,
      followUpDate
    });

    // If interested, trigger course enrollment flow
    if (outcome === 'interested' && courseInterest) {
      await triggerCourseEnrollmentFlow(lead, courseInterest);
    }

    res.json({
      message: 'Call marked as completed',
      leadId: lead._id,
      newStage: lead.stage
    });

  } catch (error) {
    console.error('Complete call error:', error);
    res.status(500).json({ error: 'Failed to mark call as completed' });
  }
});

// GET /api/booking/upcoming - Get upcoming bookings
router.get('/upcoming', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + parseInt(days));

    const upcomingBookings = await Lead.find({
      callScheduled: {
        $gte: startDate,
        $lte: endDate
      },
      callCompleted: { $ne: true }
    }).select('email firstName lastName phone careerGoal callScheduled bookingId notes');

    res.json({
      bookings: upcomingBookings,
      count: upcomingBookings.length,
      dateRange: { startDate, endDate }
    });

  } catch (error) {
    console.error('Upcoming bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming bookings' });
  }
});

// Helper Functions

async function sendBookingConfirmation(lead, bookingDetails) {
  const emailTemplate = {
    subject: `✅ Your Career Consultation is Confirmed, ${lead.firstName}!`,
    html: `
      <h2>Hi ${lead.firstName},</h2>
      <p>Great news! Your free career consultation is confirmed.</p>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h3>📅 Booking Details</h3>
        <p><strong>Date & Time:</strong> ${new Date(bookingDetails.startTime).toLocaleString()}</p>
        <p><strong>Duration:</strong> 30 minutes</p>
        <p><strong>Meeting Link:</strong> Will be sent separately</p>
      </div>
      <p>Our expert will help you create a personalized roadmap for your ${lead.careerGoal} journey.</p>
      <p>See you soon!</p>
    `,
    text: `Hi ${lead.firstName}, your career consultation is confirmed for ${new Date(bookingDetails.startTime).toLocaleString()}.`
  };

  // Send email (implementation depends on email service)
  console.log('Sending booking confirmation to:', lead.email);
}

async function notifySalesTeam(lead, bookingDetails) {
  try {
    // Send Slack notification or webhook to sales team
    const notification = {
      leadId: lead._id,
      leadName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      careerGoal: lead.careerGoal,
      leadScore: lead.leadScore,
      callTime: bookingDetails.startTime,
      timezone: bookingDetails.timezone,
      additionalContext: bookingDetails.additionalQuestions
    };

    // This would integrate with Slack, Teams, or internal notification system
    console.log('Sales team notification:', notification);
  } catch (error) {
    console.error('Failed to notify sales team:', error);
  }
}

async function sendRescheduleConfirmation(lead, rescheduleDetails) {
  console.log(`Sending reschedule confirmation to ${lead.email}`);
}

async function sendCancellationEmail(lead, reason) {
  console.log(`Sending cancellation email to ${lead.email}`);
}

async function sendPostCallFollowUp(lead, callDetails) {
  console.log(`Sending post-call follow-up to ${lead.email}`);
}

async function triggerCourseEnrollmentFlow(lead, courseInterest) {
  console.log(`Triggering course enrollment flow for ${lead.email}, interested in: ${courseInterest}`);
}

module.exports = router;
