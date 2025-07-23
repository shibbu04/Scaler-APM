const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  
  // Lead Source & Tracking
  source: {
    type: String,
    enum: ['blog', 'social', 'paid-ad', 'referral', 'direct'],
    default: 'blog'
  },
  utmSource: String,
  utmMedium: String,
  utmCampaign: String,
  referrerUrl: String,
  
  // Interest & Segmentation
  careerGoal: {
    type: String,
    enum: ['data-engineering', 'software-engineering', 'product-management', 'ai-ml', 'other']
  },
  experienceLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  currentRole: String,
  company: String,
  
  // Funnel Stage Tracking
  stage: {
    type: String,
    enum: ['cold', 'warm', 'hot', 'converted', 'churned'],
    default: 'cold'
  },
  lastTouchpoint: {
    type: String,
    enum: ['chatbot', 'email', 'call-booked', 'call-completed', 'purchase']
  },
  
  // Engagement Metrics
  chatbotInteractions: [{
    timestamp: { type: Date, default: Date.now },
    message: String,
    response: String,
    intent: String
  }],
  emailEngagement: {
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    lastOpened: Date,
    lastClicked: Date
  },
  
  // Booking & Conversion
  bookingId: String,
  callScheduled: Date,
  callCompleted: Boolean,
  callNotes: String,
  courseInterest: String,
  purchaseId: String,
  purchaseAmount: Number,
  purchaseDate: Date,
  
  // AI Personalization Data
  personalityProfile: {
    communicationStyle: String, // formal, casual, technical
    preferredContent: [String], // video, text, interactive
    painPoints: [String],
    motivations: [String]
  },
  
  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  notes: String,
  assignedTo: String, // sales rep
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
leadSchema.index({ email: 1 });
leadSchema.index({ stage: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ careerGoal: 1, experienceLevel: 1 });

// Virtual for full name
leadSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName || ''}`.trim();
});

// Virtual for lead score calculation
leadSchema.virtual('leadScore').get(function() {
  let score = 0;
  
  // Basic info completeness
  if (this.phone) score += 10;
  if (this.currentRole) score += 10;
  if (this.company) score += 10;
  
  // Engagement scoring
  score += this.chatbotInteractions.length * 5;
  score += this.emailEngagement.opened * 2;
  score += this.emailEngagement.clicked * 5;
  
  // Booking activity
  if (this.callScheduled) score += 30;
  if (this.callCompleted) score += 50;
  
  return Math.min(score, 100); // Cap at 100
});

// Pre-save middleware
leadSchema.pre('save', function(next) {
  // Update stage based on activities
  if (this.purchaseId) {
    this.stage = 'converted';
  } else if (this.callCompleted) {
    this.stage = 'hot';
  } else if (this.callScheduled || this.emailEngagement.clicked > 0) {
    this.stage = 'warm';
  }
  
  next();
});

// Static methods
leadSchema.statics.findByStage = function(stage) {
  return this.find({ stage, isActive: true });
};

leadSchema.statics.getEngagementStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$stage',
        count: { $sum: 1 },
        avgLeadScore: { $avg: '$leadScore' }
      }
    }
  ]);
};

module.exports = mongoose.model('Lead', leadSchema);
