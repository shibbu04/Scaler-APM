# Production Deployment Guide

This guide covers deploying the AI-powered lead conversion funnel to production environments.

## Deployment Architecture

```
Production Environment
├── Web Application (Heroku/Railway/Vercel)
├── Database (MongoDB Atlas)
├── AI Services (OpenAI API)
├── Email Service (Mailchimp)
├── Booking Service (Calendly)
├── Analytics (Google Analytics)
└── Automation (Zapier)
```

## Environment Setup

### 1. Environment Variables

Create `.env.production`:

```bash
# Server Configuration
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/scaler-leads
JWT_SECRET=your-super-secure-jwt-secret-key
CORS_ORIGIN=https://yourdomain.com

# AI Services
OPENAI_API_KEY=sk-your-openai-api-key

# Email Services
MAILCHIMP_API_KEY=your-mailchimp-api-key
MAILCHIMP_SERVER_PREFIX=us1
MAILCHIMP_AUDIENCE_ID=your-audience-id

# Booking Service
CALENDLY_API_TOKEN=your-calendly-token
CALENDLY_WEBHOOK_URL=https://yourdomain.com/api/webhooks/calendly

# Analytics
GOOGLE_ANALYTICS_ID=GA4-MEASUREMENT-ID

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
HELMET_CSP_ENABLED=true
TRUST_PROXY=true

# Zapier Webhooks
ZAPIER_WEBHOOK_SECRET=your-zapier-webhook-secret
```

### 2. Database Setup (MongoDB Atlas)

#### Create MongoDB Atlas Cluster:
```bash
# 1. Sign up at https://cloud.mongodb.com
# 2. Create new cluster (M0 free tier for development)
# 3. Create database user
# 4. Whitelist IP addresses (0.0.0.0/0 for production)
# 5. Get connection string
```

#### Database Indexes:
```javascript
// Connect to MongoDB and create indexes
db.leads.createIndex({ "email": 1 }, { unique: true })
db.leads.createIndex({ "createdAt": 1 })
db.leads.createIndex({ "stage": 1 })
db.leads.createIndex({ "leadScore": -1 })
db.leads.createIndex({ "lastInteraction": 1 })
db.leads.createIndex({ "source": 1 })
```

## Platform-Specific Deployments

### Option 1: Heroku Deployment

#### Prerequisites:
```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli
```

#### Deployment Steps:
```bash
# 1. Initialize git repository
git init
git add .
git commit -m "Initial commit"

# 2. Create Heroku app
heroku create scaler-lead-funnel

# 3. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-connection-string
heroku config:set JWT_SECRET=your-jwt-secret
heroku config:set OPENAI_API_KEY=your-openai-key
heroku config:set MAILCHIMP_API_KEY=your-mailchimp-key
# ... set all other environment variables

# 4. Deploy
git push heroku main

# 5. Open application
heroku open
```

#### Heroku Configuration Files:

**Procfile:**
```
web: node server.js
```

**package.json scripts:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "heroku-postbuild": "echo 'Build completed'"
  }
}
```

### Option 2: Railway Deployment

#### Railway Setup:
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Initialize project
railway init

# 4. Set environment variables in Railway dashboard
# 5. Deploy
railway up
```

**railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
```

### Option 3: Vercel Deployment (Frontend + Serverless Functions)

#### Vercel Configuration:

**vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/**/*",
      "use": "@vercel/static"
    },
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "MONGODB_URI": "@mongodb_uri",
    "JWT_SECRET": "@jwt_secret",
    "OPENAI_API_KEY": "@openai_api_key"
  }
}
```

## SSL Certificate Setup

### Option 1: Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Option 2: Cloudflare (Recommended)
```bash
# 1. Add your domain to Cloudflare
# 2. Update nameservers
# 3. Enable SSL/TLS encryption (Full)
# 4. Configure Page Rules for optimization
```

## Domain Configuration

### DNS Settings:
```
# A Records
yourdomain.com     ->  your-server-ip
www.yourdomain.com ->  your-server-ip

# CNAME Records (if using platform)
yourdomain.com     ->  your-app.herokuapp.com
www.yourdomain.com ->  your-app.herokuapp.com
```

## Performance Optimization

### 1. Application-Level Optimizations

**Enable Compression:**
```javascript
// Already implemented in server.js
const compression = require('compression');
app.use(compression());
```

**Static File Caching:**
```javascript
// Add to server.js
app.use(express.static('frontend', {
  maxAge: '1d',
  etag: true
}));
```

### 2. Database Optimization

**Connection Pooling:**
```javascript
// mongoose configuration
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
});
```

### 3. CDN Configuration

**Cloudflare Settings:**
```yaml
caching:
  - css: 1 month
  - js: 1 month  
  - images: 1 month
  - html: 4 hours

optimization:
  - minify_css: true
  - minify_js: true
  - minify_html: true
  - auto_minify: true
```

## Security Configuration

### 1. Firewall Rules
```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow SSH (if using VPS)
sudo ufw allow 22

# Enable firewall
sudo ufw enable
```

### 2. Security Headers (already implemented)
```javascript
// In server.js - already configured
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      scriptSrc: ["'self'", "www.google-analytics.com"],
      connectSrc: ["'self'", "api.openai.com"]
    }
  }
}));
```

## Monitoring & Logging

### 1. Application Monitoring

**Health Check Endpoint:**
```javascript
// Add to server.js
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});
```

### 2. Error Tracking (Sentry)

**Installation:**
```bash
npm install @sentry/node @sentry/tracing
```

**Configuration:**
```javascript
// Add to server.js
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
```

### 3. Log Management

**Winston Logger:**
```javascript
// Create services/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

## Backup Strategy

### 1. Database Backups

**MongoDB Atlas Automated Backups:**
```bash
# Atlas provides automatic backups
# Configure backup schedule in Atlas dashboard
# Point-in-time recovery available
```

**Manual Backup Script:**
```bash
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="/backups/backup_$DATE"
tar -czf "/backups/backup_$DATE.tar.gz" "/backups/backup_$DATE"
rm -rf "/backups/backup_$DATE"

# Keep only last 7 backups
find /backups -name "backup_*.tar.gz" -mtime +7 -delete
```

### 2. Code Backups
```bash
# Git repository (GitHub/GitLab)
git remote add origin https://github.com/yourusername/scaler-lead-funnel.git
git push -u origin main

# Automated deployments on push
# Configure CI/CD pipeline
```

## CI/CD Pipeline

### GitHub Actions Workflow

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{secrets.HEROKU_API_KEY}}
        heroku_app_name: "scaler-lead-funnel"
        heroku_email: "your-email@example.com"
```

## Cost Estimation

### Monthly Operating Costs:

```yaml
infrastructure:
  heroku_dyno: $7/month (Basic)
  mongodb_atlas: $0 (M0 Free Tier) or $57/month (M10)
  domain: $12/year
  ssl_certificate: $0 (Let's Encrypt)

services:
  openai_api: ~$50/month (estimated usage)
  mailchimp: $10/month (Essentials plan)
  calendly: $8/month (Essentials plan)
  zapier: $20/month (Starter plan)
  google_analytics: $0 (Free tier)

monitoring:
  sentry: $0 (Free tier) or $26/month (Team)
  
total_monthly: ~$95-150/month
```

## Launch Checklist

### Pre-Launch:
- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] Monitoring tools setup
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Performance optimizations applied

### Launch Day:
- [ ] Deploy application
- [ ] Test all endpoints
- [ ] Verify chatbot functionality
- [ ] Test email integration
- [ ] Test booking system
- [ ] Verify analytics tracking
- [ ] Test Zapier workflows
- [ ] Monitor error logs

### Post-Launch:
- [ ] Monitor performance metrics
- [ ] Track conversion rates
- [ ] Monitor error rates
- [ ] Analyze user behavior
- [ ] Optimize based on data
- [ ] Scale resources as needed

## Scaling Considerations

### Horizontal Scaling:
```bash
# Add more Heroku dynos
heroku ps:scale web=2

# Database scaling
# Upgrade MongoDB Atlas cluster
# Add read replicas if needed
```

### Performance Monitoring:
```javascript
// Add performance monitoring
const performanceMonitor = {
  trackResponseTime: (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} - ${duration}ms`);
    });
    next();
  }
};

app.use(performanceMonitor.trackResponseTime);
```

## Troubleshooting Guide

### Common Issues:
1. **502 Bad Gateway**: Check server logs, verify environment variables
2. **Database Connection Failed**: Verify MongoDB URI and IP whitelist
3. **CORS Errors**: Check CORS_ORIGIN environment variable
4. **High Response Times**: Enable caching, optimize database queries
5. **Memory Issues**: Monitor memory usage, optimize data processing

### Debug Commands:
```bash
# Check logs
heroku logs --tail

# Check dyno status
heroku ps

# Restart application
heroku restart

# Access database
heroku run node
> require('mongoose').connect(process.env.MONGODB_URI)
```

This deployment guide provides everything needed to take the lead conversion funnel from development to production. Follow the checklist and monitor the application closely during the first few weeks of operation.
