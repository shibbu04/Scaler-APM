// Validation middleware for API requests

const validateLead = (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Validate career goal if provided
  const validCareerGoals = ['data-engineering', 'software-engineering', 'product-management', 'ai-ml', 'other'];
  if (req.body.careerGoal && !validCareerGoals.includes(req.body.careerGoal)) {
    return res.status(400).json({ error: 'Invalid career goal' });
  }
  
  // Validate experience level if provided
  const validExperienceLevels = ['beginner', 'intermediate', 'advanced'];
  if (req.body.experienceLevel && !validExperienceLevels.includes(req.body.experienceLevel)) {
    return res.status(400).json({ error: 'Invalid experience level' });
  }
  
  next();
};

const validateLeadUpdate = (req, res, next) => {
  // Similar validation but allow partial updates
  if (req.body.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
  }
  
  next();
};

const validateChatbotInteraction = (req, res, next) => {
  const { message } = req.body;
  
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  if (message.length > 1000) {
    return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
  }
  
  next();
};

const validateEmailData = (req, res, next) => {
  const { email, firstName } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
    return res.status(400).json({ error: 'First name is required' });
  }
  
  next();
};

const validateBookingData = (req, res, next) => {
  const { email, startTime, endTime } = req.body;
  
  if (!email || !startTime || !endTime) {
    return res.status(400).json({ error: 'Email, start time, and end time are required' });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Validate dates
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: 'Invalid date format' });
  }
  
  if (start >= end) {
    return res.status(400).json({ error: 'Start time must be before end time' });
  }
  
  if (start < new Date()) {
    return res.status(400).json({ error: 'Cannot schedule booking in the past' });
  }
  
  next();
};

// Rate limiting for specific endpoints
const createRateLimiter = (windowMs, max, message) => {
  const rateLimit = require('express-rate-limit');
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Specific rate limiters
const chatbotRateLimit = createRateLimiter(
  60000, // 1 minute
  30, // 30 requests per minute
  'Too many chatbot interactions, please slow down'
);

const emailRateLimit = createRateLimiter(
  3600000, // 1 hour  
  10, // 10 email actions per hour
  'Too many email actions, please try again later'
);

const bookingRateLimit = createRateLimiter(
  900000, // 15 minutes
  3, // 3 booking actions per 15 minutes
  'Too many booking attempts, please try again later'
);

// Security middleware
const sanitizeInput = (req, res, next) => {
  // Basic input sanitization
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential XSS attempts
        obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        obj[key] = obj[key].replace(/javascript:/gi, '');
        obj[key] = obj[key].replace(/on\w+=/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };
  
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({ error: 'Duplicate entry', field: Object.keys(err.keyPattern)[0] });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }
  
  // Default error
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    
    // Log errors and slow requests
    if (res.statusCode >= 400 || duration > 1000) {
      console.log(`Slow/Error request: ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    }
  });
  
  next();
};

module.exports = {
  validateLead,
  validateLeadUpdate,
  validateChatbotInteraction,
  validateEmailData,
  validateBookingData,
  chatbotRateLimit,
  emailRateLimit,
  bookingRateLimit,
  sanitizeInput,
  errorHandler,
  requestLogger
};
