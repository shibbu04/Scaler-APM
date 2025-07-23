const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');

// GET /api/analytics/dashboard - Get main dashboard metrics
router.get('/dashboard', async (req, res) => {
  try {
    const { 
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate = new Date() 
    } = req.query;

    // Parallel queries for better performance
    const [
      totalLeads,
      stageDistribution,
      sourceDistribution,
      conversionFunnel,
      revenueMetrics,
      engagementMetrics,
      timeSeriesData
    ] = await Promise.all([
      getTotalLeads(startDate, endDate),
      getStageDistribution(startDate, endDate),
      getSourceDistribution(startDate, endDate),
      getConversionFunnel(startDate, endDate),
      getRevenueMetrics(startDate, endDate),
      getEngagementMetrics(startDate, endDate),
      getTimeSeriesData(startDate, endDate)
    ]);

    res.json({
      dateRange: { startDate, endDate },
      overview: totalLeads,
      funnel: {
        stages: stageDistribution,
        conversion: conversionFunnel
      },
      sources: sourceDistribution,
      revenue: revenueMetrics,
      engagement: engagementMetrics,
      trends: timeSeriesData,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

// GET /api/analytics/leads/:id - Get detailed lead analytics
router.get('/leads/:id', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Calculate lead journey timeline
    const timeline = [];
    
    // Add creation event
    timeline.push({
      date: lead.createdAt,
      event: 'Lead Created',
      details: `Source: ${lead.source}`,
      stage: 'cold'
    });

    // Add chatbot interactions
    lead.chatbotInteractions.forEach(interaction => {
      timeline.push({
        date: interaction.timestamp,
        event: 'Chatbot Interaction',
        details: interaction.message.substring(0, 100) + '...',
        stage: 'warm'
      });
    });

    // Add email engagement
    if (lead.emailEngagement.lastOpened) {
      timeline.push({
        date: lead.emailEngagement.lastOpened,
        event: 'Email Opened',
        details: `Total opens: ${lead.emailEngagement.opened}`,
        stage: 'warm'
      });
    }

    if (lead.emailEngagement.lastClicked) {
      timeline.push({
        date: lead.emailEngagement.lastClicked,
        event: 'Email Clicked',
        details: `Total clicks: ${lead.emailEngagement.clicked}`,
        stage: 'warm'
      });
    }

    // Add booking events
    if (lead.callScheduled) {
      timeline.push({
        date: lead.callScheduled,
        event: 'Call Scheduled',
        details: `Booking ID: ${lead.bookingId}`,
        stage: 'hot'
      });
    }

    if (lead.callCompleted) {
      timeline.push({
        date: lead.updatedAt,
        event: 'Call Completed',
        details: lead.callNotes || 'Call completed',
        stage: 'hot'
      });
    }

    // Add purchase event
    if (lead.purchaseDate) {
      timeline.push({
        date: lead.purchaseDate,
        event: 'Purchase Made',
        details: `Amount: $${lead.purchaseAmount}`,
        stage: 'converted'
      });
    }

    // Sort timeline by date
    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      lead: {
        id: lead._id,
        name: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        stage: lead.stage,
        leadScore: lead.leadScore,
        source: lead.source,
        careerGoal: lead.careerGoal,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt
      },
      timeline,
      engagement: {
        chatbotInteractions: lead.chatbotInteractions.length,
        emailOpens: lead.emailEngagement.opened,
        emailClicks: lead.emailEngagement.clicked,
        callScheduled: !!lead.callScheduled,
        callCompleted: !!lead.callCompleted
      },
      conversion: {
        purchased: !!lead.purchaseId,
        amount: lead.purchaseAmount,
        course: lead.courseInterest
      }
    });

  } catch (error) {
    console.error('Lead analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch lead analytics' });
  }
});

// GET /api/analytics/funnel - Get detailed funnel analysis
router.get('/funnel', async (req, res) => {
  try {
    const { startDate, endDate, segmentBy } = req.query;

    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          },
          isActive: true
        }
      },
      {
        $group: {
          _id: segmentBy ? `$${segmentBy}` : null,
          totalLeads: { $sum: 1 },
          coldLeads: { $sum: { $cond: [{ $eq: ['$stage', 'cold'] }, 1, 0] } },
          warmLeads: { $sum: { $cond: [{ $eq: ['$stage', 'warm'] }, 1, 0] } },
          hotLeads: { $sum: { $cond: [{ $eq: ['$stage', 'hot'] }, 1, 0] } },
          convertedLeads: { $sum: { $cond: [{ $eq: ['$stage', 'converted'] }, 1, 0] } },
          churnedLeads: { $sum: { $cond: [{ $eq: ['$stage', 'churned'] }, 1, 0] } },
          totalRevenue: { $sum: '$purchaseAmount' },
          avgLeadScore: { $avg: '$leadScore' }
        }
      }
    ];

    const results = await Lead.aggregate(pipeline);

    // Calculate conversion rates
    const funnelData = results.map(segment => {
      const coldToWarm = segment.warmLeads / (segment.coldLeads + segment.warmLeads) * 100;
      const warmToHot = segment.hotLeads / (segment.warmLeads + segment.hotLeads) * 100;
      const hotToConverted = segment.convertedLeads / (segment.hotLeads + segment.convertedLeads) * 100;
      const overallConversion = segment.convertedLeads / segment.totalLeads * 100;

      return {
        segment: segment._id,
        stages: {
          cold: segment.coldLeads,
          warm: segment.warmLeads,
          hot: segment.hotLeads,
          converted: segment.convertedLeads,
          churned: segment.churnedLeads
        },
        conversionRates: {
          coldToWarm: coldToWarm.toFixed(2),
          warmToHot: warmToHot.toFixed(2),
          hotToConverted: hotToConverted.toFixed(2),
          overall: overallConversion.toFixed(2)
        },
        metrics: {
          totalLeads: segment.totalLeads,
          totalRevenue: segment.totalRevenue || 0,
          avgLeadScore: segment.avgLeadScore?.toFixed(1) || 0,
          revenuePerLead: ((segment.totalRevenue || 0) / segment.totalLeads).toFixed(2)
        }
      };
    });

    res.json({
      segmentBy: segmentBy || 'overall',
      dateRange: { startDate, endDate },
      funnel: funnelData
    });

  } catch (error) {
    console.error('Funnel analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch funnel analytics' });
  }
});

// GET /api/analytics/cohort - Get cohort analysis
router.get('/cohort', async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;

    // Group leads by signup period and track their conversion over time
    const cohortData = await Lead.aggregate([
      {
        $group: {
          _id: {
            period: {
              $dateToString: {
                format: period === 'weekly' ? '%Y-W%U' : '%Y-%m',
                date: '$createdAt'
              }
            }
          },
          totalLeads: { $sum: 1 },
          convertedLeads: { $sum: { $cond: [{ $eq: ['$stage', 'converted'] }, 1, 0] } },
          totalRevenue: { $sum: '$purchaseAmount' },
          avgTimeToConversion: {
            $avg: {
              $cond: [
                { $and: [{ $ne: ['$purchaseDate', null] }, { $ne: ['$createdAt', null] }] },
                { $divide: [{ $subtract: ['$purchaseDate', '$createdAt'] }, 86400000] }, // days
                null
              ]
            }
          }
        }
      },
      { $sort: { '_id.period': 1 } }
    ]);

    const cohorts = cohortData.map(cohort => ({
      period: cohort._id.period,
      totalLeads: cohort.totalLeads,
      convertedLeads: cohort.convertedLeads,
      conversionRate: ((cohort.convertedLeads / cohort.totalLeads) * 100).toFixed(2),
      totalRevenue: cohort.totalRevenue || 0,
      avgTimeToConversion: cohort.avgTimeToConversion?.toFixed(1) || null
    }));

    res.json({
      period,
      cohorts,
      summary: {
        totalCohorts: cohorts.length,
        avgConversionRate: (cohorts.reduce((sum, c) => sum + parseFloat(c.conversionRate), 0) / cohorts.length).toFixed(2),
        totalRevenue: cohorts.reduce((sum, c) => sum + c.totalRevenue, 0)
      }
    });

  } catch (error) {
    console.error('Cohort analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch cohort analysis' });
  }
});

// GET /api/analytics/attribution - Get marketing attribution data
router.get('/attribution', async (req, res) => {
  try {
    const attribution = await Lead.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: {
            source: '$source',
            utmSource: '$utmSource',
            utmMedium: '$utmMedium',
            utmCampaign: '$utmCampaign'
          },
          leads: { $sum: 1 },
          conversions: { $sum: { $cond: [{ $eq: ['$stage', 'converted'] }, 1, 0] } },
          revenue: { $sum: '$purchaseAmount' },
          avgLeadScore: { $avg: '$leadScore' }
        }
      },
      { $sort: { leads: -1 } }
    ]);

    const attributionData = attribution.map(item => ({
      source: item._id.source,
      utmSource: item._id.utmSource,
      utmMedium: item._id.utmMedium,
      utmCampaign: item._id.utmCampaign,
      leads: item.leads,
      conversions: item.conversions,
      conversionRate: ((item.conversions / item.leads) * 100).toFixed(2),
      revenue: item.revenue || 0,
      costPerLead: 0, // Would need to integrate with ad spend data
      returnOnAdSpend: 0, // Would need ad spend data
      avgLeadScore: item.avgLeadScore?.toFixed(1) || 0
    }));

    res.json({
      attribution: attributionData,
      summary: {
        totalSources: attributionData.length,
        bestPerformingSource: attributionData[0],
        totalRevenue: attributionData.reduce((sum, item) => sum + item.revenue, 0)
      }
    });

  } catch (error) {
    console.error('Attribution analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch attribution data' });
  }
});

// Helper Functions

async function getTotalLeads(startDate, endDate) {
  const result = await Lead.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        newThisPeriod: { $sum: 1 },
        avgLeadScore: { $avg: '$leadScore' }
      }
    }
  ]);

  return result[0] || { total: 0, newThisPeriod: 0, avgLeadScore: 0 };
}

async function getStageDistribution(startDate, endDate) {
  return await Lead.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        isActive: true
      }
    },
    {
      $group: {
        _id: '$stage',
        count: { $sum: 1 },
        avgLeadScore: { $avg: '$leadScore' }
      }
    }
  ]);
}

async function getSourceDistribution(startDate, endDate) {
  return await Lead.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        isActive: true
      }
    },
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 },
        conversions: { $sum: { $cond: [{ $eq: ['$stage', 'converted'] }, 1, 0] } }
      }
    }
  ]);
}

async function getConversionFunnel(startDate, endDate) {
  const result = await Lead.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalLeads: { $sum: 1 },
        engaged: { $sum: { $cond: [{ $gt: ['$emailEngagement.opened', 0] }, 1, 0] } },
        scheduled: { $sum: { $cond: [{ $ne: ['$callScheduled', null] }, 1, 0] } },
        converted: { $sum: { $cond: [{ $eq: ['$stage', 'converted'] }, 1, 0] } }
      }
    }
  ]);

  return result[0] || { totalLeads: 0, engaged: 0, scheduled: 0, converted: 0 };
}

async function getRevenueMetrics(startDate, endDate) {
  const result = await Lead.aggregate([
    {
      $match: {
        purchaseDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$purchaseAmount' },
        totalPurchases: { $sum: 1 },
        avgOrderValue: { $avg: '$purchaseAmount' }
      }
    }
  ]);

  return result[0] || { totalRevenue: 0, totalPurchases: 0, avgOrderValue: 0 };
}

async function getEngagementMetrics(startDate, endDate) {
  const result = await Lead.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        avgChatbotInteractions: { $avg: { $size: '$chatbotInteractions' } },
        avgEmailOpens: { $avg: '$emailEngagement.opened' },
        avgEmailClicks: { $avg: '$emailEngagement.clicked' },
        totalCallsScheduled: { $sum: { $cond: [{ $ne: ['$callScheduled', null] }, 1, 0] } },
        totalCallsCompleted: { $sum: { $cond: [{ $eq: ['$callCompleted', true] }, 1, 0] } }
      }
    }
  ]);

  return result[0] || {
    avgChatbotInteractions: 0,
    avgEmailOpens: 0,
    avgEmailClicks: 0,
    totalCallsScheduled: 0,
    totalCallsCompleted: 0
  };
}

async function getTimeSeriesData(startDate, endDate) {
  return await Lead.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        isActive: true
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        leads: { $sum: 1 },
        conversions: { $sum: { $cond: [{ $eq: ['$stage', 'converted'] }, 1, 0] } }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
}

module.exports = router;
