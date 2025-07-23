# Testing Guide - AI Lead Conversion Funnel

This guide covers comprehensive testing strategies for the AI-powered lead conversion funnel system.

## Testing Overview

```
Testing Strategy
├── Unit Tests (Individual components)
├── Integration Tests (API endpoints)
├── End-to-End Tests (User journeys)
├── Load Testing (Performance)
├── Security Testing (Vulnerabilities)
└── User Acceptance Testing (UAT)
```

## Unit Testing Setup

### Installation:
```bash
npm install --save-dev jest supertest mongodb-memory-server
```

### Jest Configuration

**jest.config.js:**
```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'models/**/*.js',
    'routes/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000
};
```

### Test Setup File

**tests/setup.js:**
```javascript
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

// Mock external services
jest.mock('../services/aiService', () => ({
  generateResponse: jest.fn().mockResolvedValue('Mocked AI response'),
  generateEmailContent: jest.fn().mockResolvedValue('Mocked email content'),
  analyzeLead: jest.fn().mockResolvedValue({ score: 75, insights: [] })
}));

jest.mock('../services/emailService', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
  sendNurtureEmail: jest.fn().mockResolvedValue({ success: true }),
  addToMailchimp: jest.fn().mockResolvedValue({ id: 'mock-id' })
}));
```

## Unit Tests

### Model Tests

**tests/models/Lead.test.js:**
```javascript
const Lead = require('../../models/Lead');

describe('Lead Model', () => {
  describe('Validation', () => {
    test('should create a valid lead', async () => {
      const leadData = {
        email: 'test@example.com',
        name: 'John Doe',
        careerGoal: 'data-engineering',
        currentRole: 'Business Analyst',
        experienceLevel: 'intermediate'
      };
      
      const lead = new Lead(leadData);
      const savedLead = await lead.save();
      
      expect(savedLead.email).toBe(leadData.email);
      expect(savedLead.stage).toBe('cold');
      expect(savedLead.leadScore).toBe(0);
      expect(savedLead.createdAt).toBeInstanceOf(Date);
    });

    test('should require email field', async () => {
      const lead = new Lead({
        name: 'John Doe',
        careerGoal: 'data-engineering'
      });
      
      await expect(lead.save()).rejects.toThrow('Path `email` is required');
    });

    test('should validate email format', async () => {
      const lead = new Lead({
        email: 'invalid-email',
        name: 'John Doe',
        careerGoal: 'data-engineering'
      });
      
      await expect(lead.save()).rejects.toThrow('Invalid email format');
    });

    test('should enforce unique email constraint', async () => {
      const leadData = {
        email: 'test@example.com',
        name: 'John Doe',
        careerGoal: 'data-engineering'
      };
      
      await new Lead(leadData).save();
      const duplicateLead = new Lead(leadData);
      
      await expect(duplicateLead.save()).rejects.toThrow();
    });
  });

  describe('Methods', () => {
    test('should calculate lead score correctly', async () => {
      const lead = new Lead({
        email: 'test@example.com',
        name: 'John Doe',
        careerGoal: 'data-engineering',
        phone: '+1234567890',
        currentRole: 'Software Engineer',
        experienceLevel: 'advanced',
        timeline: 'ASAP'
      });
      
      const score = lead.calculateLeadScore();
      expect(score).toBeGreaterThan(70); // Advanced experience + phone + urgent timeline
    });

    test('should update lead stage correctly', async () => {
      const lead = await new Lead({
        email: 'test@example.com',
        name: 'John Doe',
        careerGoal: 'data-engineering'
      }).save();
      
      await lead.updateStage('warm');
      expect(lead.stage).toBe('warm');
      expect(lead.stageHistory).toHaveLength(2); // cold -> warm
    });

    test('should record interaction correctly', async () => {
      const lead = await new Lead({
        email: 'test@example.com',
        name: 'John Doe',
        careerGoal: 'data-engineering'
      }).save();
      
      await lead.recordInteraction('chatbot', 'Asked about salary');
      expect(lead.interactions).toHaveLength(1);
      expect(lead.interactions[0].type).toBe('chatbot');
      expect(lead.lastInteraction).toBeInstanceOf(Date);
    });
  });
});
```

### Service Tests

**tests/services/aiService.test.js:**
```javascript
const aiService = require('../../services/aiService');

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }))
}));

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateResponse', () => {
    test('should generate appropriate response for greeting', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Hello! I\'m here to help with your career goals.'
          }
        }]
      };
      
      const openai = new (require('openai').OpenAI)();
      openai.chat.completions.create.mockResolvedValue(mockResponse);
      
      const response = await aiService.generateResponse(
        'Hello',
        { careerGoal: 'data-engineering' }
      );
      
      expect(response).toContain('help');
      expect(openai.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system'
            }),
            expect.objectContaining({
              role: 'user',
              content: 'Hello'
            })
          ])
        })
      );
    });

    test('should handle API errors gracefully', async () => {
      const openai = new (require('openai').OpenAI)();
      openai.chat.completions.create.mockRejectedValue(new Error('API Error'));
      
      const response = await aiService.generateResponse('Hello', {});
      
      expect(response).toBe('I apologize, but I\'m having technical difficulties. Please try again in a moment.');
    });
  });

  describe('analyzeLead', () => {
    test('should analyze lead and return score', async () => {
      const leadData = {
        email: 'test@example.com',
        careerGoal: 'data-engineering',
        experienceLevel: 'advanced',
        phone: '+1234567890'
      };
      
      const analysis = await aiService.analyzeLead(leadData);
      
      expect(analysis).toHaveProperty('score');
      expect(analysis).toHaveProperty('insights');
      expect(analysis.score).toBeGreaterThan(0);
      expect(analysis.score).toBeLessThanOrEqual(100);
    });
  });
});
```

## Integration Tests

### API Endpoint Tests

**tests/routes/leads.test.js:**
```javascript
const request = require('supertest');
const app = require('../../server');
const Lead = require('../../models/Lead');

describe('/api/leads', () => {
  describe('POST /api/leads', () => {
    test('should create a new lead', async () => {
      const leadData = {
        email: 'test@example.com',
        name: 'John Doe',
        careerGoal: 'data-engineering',
        currentRole: 'Business Analyst'
      };
      
      const response = await request(app)
        .post('/api/leads')
        .send(leadData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(leadData.email);
      
      const savedLead = await Lead.findOne({ email: leadData.email });
      expect(savedLead).toBeTruthy();
    });

    test('should return 400 for invalid email', async () => {
      const leadData = {
        email: 'invalid-email',
        name: 'John Doe',
        careerGoal: 'data-engineering'
      };
      
      const response = await request(app)
        .post('/api/leads')
        .send(leadData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid email');
    });

    test('should return 409 for duplicate email', async () => {
      const leadData = {
        email: 'test@example.com',
        name: 'John Doe',
        careerGoal: 'data-engineering'
      };
      
      // Create first lead
      await request(app)
        .post('/api/leads')
        .send(leadData)
        .expect(201);
      
      // Try to create duplicate
      const response = await request(app)
        .post('/api/leads')
        .send(leadData)
        .expect(409);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('GET /api/leads/:id', () => {
    test('should retrieve lead by ID', async () => {
      const lead = await new Lead({
        email: 'test@example.com',
        name: 'John Doe',
        careerGoal: 'data-engineering'
      }).save();
      
      const response = await request(app)
        .get(`/api/leads/${lead._id}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(lead.email);
    });

    test('should return 404 for non-existent lead', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/leads/${fakeId}`)
        .expect(404);
      
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/leads/:id', () => {
    test('should update lead information', async () => {
      const lead = await new Lead({
        email: 'test@example.com',
        name: 'John Doe',
        careerGoal: 'data-engineering'
      }).save();
      
      const updateData = {
        phone: '+1234567890',
        currentRole: 'Senior Analyst'
      };
      
      const response = await request(app)
        .put(`/api/leads/${lead._id}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.phone).toBe(updateData.phone);
      expect(response.body.data.currentRole).toBe(updateData.currentRole);
    });
  });
});
```

### Chatbot Integration Tests

**tests/routes/chatbot.test.js:**
```javascript
const request = require('supertest');
const app = require('../../server');
const Lead = require('../../models/Lead');

describe('/api/chatbot', () => {
  describe('POST /api/chatbot/message', () => {
    test('should handle new conversation', async () => {
      const messageData = {
        message: 'Hello',
        sessionId: 'test-session-123'
      };
      
      const response = await request(app)
        .post('/api/chatbot/message')
        .send(messageData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('response');
      expect(response.body.data).toHaveProperty('sessionId');
      expect(response.body.data.response).toContain('hello');
    });

    test('should collect lead information', async () => {
      const sessionId = 'test-session-456';
      
      // Initial greeting
      await request(app)
        .post('/api/chatbot/message')
        .send({ message: 'Hi', sessionId });
      
      // Provide email
      const response = await request(app)
        .post('/api/chatbot/message')
        .send({ 
          message: 'test@example.com', 
          sessionId,
          context: { collectingEmail: true }
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.context).toHaveProperty('email', 'test@example.com');
    });

    test('should rate limit chatbot requests', async () => {
      const sessionId = 'rate-limit-test';
      
      // Make multiple rapid requests
      const promises = Array.from({ length: 15 }, (_, i) => 
        request(app)
          .post('/api/chatbot/message')
          .send({ message: `Message ${i}`, sessionId })
      );
      
      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
```

## End-to-End Tests

### User Journey Tests

**tests/e2e/leadConversion.test.js:**
```javascript
const request = require('supertest');
const app = require('../../server');
const Lead = require('../../models/Lead');

describe('Lead Conversion Journey', () => {
  test('should complete full lead conversion flow', async () => {
    const sessionId = 'e2e-test-session';
    const email = 'e2e@example.com';
    
    // Step 1: Initial chatbot interaction
    let response = await request(app)
      .post('/api/chatbot/message')
      .send({ message: 'Hi, I want to become a data engineer', sessionId })
      .expect(200);
    
    expect(response.body.data.response).toContain('data engineer');
    
    // Step 2: Provide email
    response = await request(app)
      .post('/api/chatbot/message')
      .send({ 
        message: email, 
        sessionId,
        context: { collectingEmail: true }
      })
      .expect(200);
    
    // Step 3: Provide name
    response = await request(app)
      .post('/api/chatbot/message')
      .send({ 
        message: 'John Doe', 
        sessionId,
        context: { collectingName: true }
      })
      .expect(200);
    
    // Step 4: Express booking interest
    response = await request(app)
      .post('/api/chatbot/message')
      .send({ 
        message: 'Yes, book my call!', 
        sessionId
      })
      .expect(200);
    
    expect(response.body.data.response).toContain('booking');
    
    // Verify lead was created and updated
    const lead = await Lead.findOne({ email });
    expect(lead).toBeTruthy();
    expect(lead.name).toBe('John Doe');
    expect(lead.careerGoal).toBe('data-engineering');
    expect(lead.stage).toBe('warm');
    expect(lead.interactions.length).toBeGreaterThan(0);
  });
});
```

## Load Testing

### Using Artillery

**artillery.yml:**
```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 20
    - duration: 60
      arrivalRate: 10
  payload:
    path: 'test-data.csv'
    fields:
      - email
      - name
      - careerGoal

scenarios:
  - name: "Lead Creation Flow"
    weight: 60
    flow:
      - post:
          url: "/api/leads"
          json:
            email: "{{ email }}"
            name: "{{ name }}"
            careerGoal: "{{ careerGoal }}"
            currentRole: "Business Analyst"
      - think: 2
      - post:
          url: "/api/chatbot/message"
          json:
            message: "Hello"
            sessionId: "load-test-{{ $uuid }}"

  - name: "Chatbot Interaction"
    weight: 40
    flow:
      - post:
          url: "/api/chatbot/message"
          json:
            message: "I want to become a data engineer"
            sessionId: "chatbot-{{ $uuid }}"
      - think: 1
      - post:
          url: "/api/chatbot/message"
          json:
            message: "{{ email }}"
            sessionId: "chatbot-{{ $uuid }}"
            context:
              collectingEmail: true
```

**Running Load Tests:**
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run artillery.yml

# Generate detailed report
artillery run artillery.yml --output report.json
artillery report report.json
```

## Security Testing

### Authentication Tests

**tests/security/auth.test.js:**
```javascript
const request = require('supertest');
const app = require('../../server');
const jwt = require('jsonwebtoken');

describe('Authentication Security', () => {
  test('should reject requests without valid JWT', async () => {
    const response = await request(app)
      .get('/api/admin/leads')
      .expect(401);
    
    expect(response.body.error).toContain('unauthorized');
  });

  test('should reject expired JWT tokens', async () => {
    const expiredToken = jwt.sign(
      { userId: 'test-user' },
      process.env.JWT_SECRET,
      { expiresIn: '-1h' }
    );
    
    const response = await request(app)
      .get('/api/admin/leads')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
    
    expect(response.body.error).toContain('expired');
  });

  test('should accept valid JWT tokens', async () => {
    const validToken = jwt.sign(
      { userId: 'test-user', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    await request(app)
      .get('/api/admin/leads')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);
  });
});
```

### Input Validation Tests

**tests/security/validation.test.js:**
```javascript
const request = require('supertest');
const app = require('../../server');

describe('Input Validation Security', () => {
  test('should sanitize HTML in input fields', async () => {
    const maliciousData = {
      email: 'test@example.com',
      name: '<script>alert("xss")</script>John Doe',
      careerGoal: 'data-engineering'
    };
    
    const response = await request(app)
      .post('/api/leads')
      .send(maliciousData)
      .expect(201);
    
    expect(response.body.data.name).not.toContain('<script>');
    expect(response.body.data.name).toContain('John Doe');
  });

  test('should reject SQL injection attempts', async () => {
    const maliciousData = {
      email: 'test@example.com',
      name: "'; DROP TABLE leads; --",
      careerGoal: 'data-engineering'
    };
    
    const response = await request(app)
      .post('/api/leads')
      .send(maliciousData)
      .expect(400);
    
    expect(response.body.error).toContain('Invalid');
  });

  test('should enforce rate limits', async () => {
    const requests = Array.from({ length: 120 }, () =>
      request(app)
        .post('/api/leads')
        .send({
          email: `test${Math.random()}@example.com`,
          name: 'Test User',
          careerGoal: 'data-engineering'
        })
    );
    
    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
```

## Performance Testing

### Database Performance Tests

**tests/performance/database.test.js:**
```javascript
const Lead = require('../../models/Lead');
const mongoose = require('mongoose');

describe('Database Performance', () => {
  beforeAll(async () => {
    // Create test data
    const leads = Array.from({ length: 1000 }, (_, i) => ({
      email: `test${i}@example.com`,
      name: `Test User ${i}`,
      careerGoal: 'data-engineering',
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    }));
    
    await Lead.insertMany(leads);
  });

  test('should query leads efficiently', async () => {
    const startTime = Date.now();
    
    const leads = await Lead.find({ careerGoal: 'data-engineering' })
      .sort({ createdAt: -1 })
      .limit(50);
    
    const queryTime = Date.now() - startTime;
    
    expect(leads.length).toBe(50);
    expect(queryTime).toBeLessThan(100); // Should complete in under 100ms
  });

  test('should aggregate data efficiently', async () => {
    const startTime = Date.now();
    
    const stats = await Lead.aggregate([
      {
        $group: {
          _id: '$careerGoal',
          count: { $sum: 1 },
          avgScore: { $avg: '$leadScore' }
        }
      }
    ]);
    
    const queryTime = Date.now() - startTime;
    
    expect(stats.length).toBeGreaterThan(0);
    expect(queryTime).toBeLessThan(200); // Should complete in under 200ms
  });
});
```

## Test Data Management

### Test Data Factory

**tests/helpers/factory.js:**
```javascript
const Lead = require('../../models/Lead');

class TestDataFactory {
  static createLead(overrides = {}) {
    const defaults = {
      email: `test${Date.now()}@example.com`,
      name: 'Test User',
      careerGoal: 'data-engineering',
      currentRole: 'Business Analyst',
      experienceLevel: 'intermediate',
      stage: 'cold',
      leadScore: 0
    };
    
    return { ...defaults, ...overrides };
  }
  
  static async createLeadInDB(overrides = {}) {
    const leadData = this.createLead(overrides);
    return await new Lead(leadData).save();
  }
  
  static async createMultipleLeads(count, overrides = {}) {
    const leads = Array.from({ length: count }, (_, i) => 
      this.createLead({ 
        email: `test${i}@example.com`,
        ...overrides 
      })
    );
    
    return await Lead.insertMany(leads);
  }
}

module.exports = TestDataFactory;
```

## Test Scripts

### Package.json Test Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:e2e": "jest --testPathPattern=tests/e2e",
    "test:security": "jest --testPathPattern=tests/security",
    "test:performance": "jest --testPathPattern=tests/performance",
    "test:load": "artillery run artillery.yml",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

## Continuous Integration

### GitHub Actions Test Workflow

**.github/workflows/test.yml:**
```yaml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        NODE_ENV: test
        JWT_SECRET: test-secret
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    
    - name: Run security tests
      run: npm run test:security
    
    - name: Generate coverage report
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        fail_ci_if_error: true
```

## Test Reporting

### Coverage Reports
```bash
# Generate HTML coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Test Results Dashboard
Use tools like:
- **Jest HTML Reporter**: Visual test results
- **Codecov**: Coverage tracking
- **SonarQube**: Code quality metrics

## Testing Checklist

### Pre-Deployment Testing:
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Security tests passing
- [ ] Performance tests within limits
- [ ] Load tests successful
- [ ] Coverage above 80%
- [ ] No critical vulnerabilities

### Production Testing:
- [ ] Health check endpoints working
- [ ] Database connectivity verified
- [ ] External API integrations working
- [ ] Email delivery working
- [ ] Chatbot responses appropriate
- [ ] Analytics tracking correctly
- [ ] Error handling working
- [ ] Rate limiting effective

This comprehensive testing guide ensures the lead conversion funnel is robust, secure, and performant before production deployment.
