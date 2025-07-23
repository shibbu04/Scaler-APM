const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const { validateLead, validateLeadUpdate } = require('../middleware/validation');

// GET /api/leads - Get all leads with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      stage,
      source,
      careerGoal,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    if (stage) filter.stage = stage;
    if (source) filter.source = source;
    if (careerGoal) filter.careerGoal = careerGoal;

    // Execute query with pagination
    const leads = await Lead.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-chatbotInteractions -notes'); // Exclude heavy fields

    const total = await Lead.countDocuments(filter);

    res.json({
      leads,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// GET /api/leads/stats - Get lead statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Lead.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          coldLeads: { $sum: { $cond: [{ $eq: ['$stage', 'cold'] }, 1, 0] } },
          warmLeads: { $sum: { $cond: [{ $eq: ['$stage', 'warm'] }, 1, 0] } },
          hotLeads: { $sum: { $cond: [{ $eq: ['$stage', 'hot'] }, 1, 0] } },
          convertedLeads: { $sum: { $cond: [{ $eq: ['$stage', 'converted'] }, 1, 0] } },
          avgLeadScore: { $avg: '$leadScore' },
          totalRevenue: { $sum: '$purchaseAmount' }
        }
      }
    ]);

    const conversionRate = stats[0] ? 
      ((stats[0].convertedLeads / stats[0].totalLeads) * 100).toFixed(2) : 0;

    res.json({
      ...stats[0],
      conversionRate: parseFloat(conversionRate)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// POST /api/leads - Create new lead
router.post('/', validateLead, async (req, res) => {
  try {
    const leadData = {
      ...req.body,
      source: req.body.source || 'blog',
      stage: 'cold'
    };

    // Check if lead already exists
    const existingLead = await Lead.findOne({ email: leadData.email });
    if (existingLead) {
      // Update existing lead instead of creating new one
      Object.assign(existingLead, leadData);
      await existingLead.save();
      return res.status(200).json({ lead: existingLead, message: 'Lead updated' });
    }

    const lead = new Lead(leadData);
    await lead.save();

    res.status(201).json({ lead, message: 'Lead created successfully' });
  } catch (error) {
    console.error('Error creating lead:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Lead with this email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create lead' });
    }
  }
});

// GET /api/leads/:id - Get single lead
router.get('/:id', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json({ lead });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// PUT /api/leads/:id - Update lead
router.put('/:id', validateLeadUpdate, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ lead, message: 'Lead updated successfully' });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// POST /api/leads/:id/interaction - Add chatbot interaction
router.post('/:id/interaction', async (req, res) => {
  try {
    const { message, response, intent } = req.body;
    
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    lead.chatbotInteractions.push({
      message,
      response,
      intent,
      timestamp: new Date()
    });

    lead.lastTouchpoint = 'chatbot';
    await lead.save();

    res.json({ message: 'Interaction recorded successfully' });
  } catch (error) {
    console.error('Error recording interaction:', error);
    res.status(500).json({ error: 'Failed to record interaction' });
  }
});

// POST /api/leads/:id/email-engagement - Track email engagement
router.post('/:id/email-engagement', async (req, res) => {
  try {
    const { type } = req.body; // 'opened' or 'clicked'
    
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    if (type === 'opened') {
      lead.emailEngagement.opened += 1;
      lead.emailEngagement.lastOpened = new Date();
    } else if (type === 'clicked') {
      lead.emailEngagement.clicked += 1;
      lead.emailEngagement.lastClicked = new Date();
    }

    lead.lastTouchpoint = 'email';
    await lead.save();

    res.json({ message: 'Email engagement tracked successfully' });
  } catch (error) {
    console.error('Error tracking email engagement:', error);
    res.status(500).json({ error: 'Failed to track email engagement' });
  }
});

// DELETE /api/leads/:id - Soft delete lead
router.delete('/:id', async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

module.exports = router;
