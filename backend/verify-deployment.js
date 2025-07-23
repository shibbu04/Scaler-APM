#!/usr/bin/env node

// Pre-deployment verification script
console.log('🔍 Running pre-deployment checks...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('PORT:', process.env.PORT || 'not set');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('MAILCHIMP_API_KEY:', process.env.MAILCHIMP_API_KEY ? '✅ Set' : '❌ Missing');
console.log();

// Test required modules
console.log('📦 Testing module imports:');
const modules = [
  'express',
  'cors', 
  'helmet',
  'compression',
  'express-rate-limit',
  'mongoose',
  'dotenv',
  'axios'
];

let allModulesOk = true;
for (const moduleName of modules) {
  try {
    require(moduleName);
    console.log(`✅ ${moduleName}`);
  } catch (error) {
    console.log(`❌ ${moduleName} - ${error.message}`);
    allModulesOk = false;
  }
}

// Test custom modules
console.log('\n🔧 Testing custom modules:');
try {
  const aiService = require('./services/aiService');
  console.log('✅ aiService');
  console.log('   Available functions:', Object.keys(aiService).join(', '));
} catch (error) {
  console.log('❌ aiService:', error.message);
  allModulesOk = false;
}

try {
  const Lead = require('./models/Lead');
  console.log('✅ Lead model');
} catch (error) {
  console.log('❌ Lead model:', error.message);
  allModulesOk = false;
}

// Test route files
console.log('\n🛣️ Testing routes:');
const routes = ['leads', 'chatbot', 'email', 'booking', 'analytics'];
for (const route of routes) {
  try {
    require(`./routes/${route}`);
    console.log(`✅ ${route} route`);
  } catch (error) {
    console.log(`❌ ${route} route:`, error.message);
    allModulesOk = false;
  }
}

console.log('\n🎯 Summary:');
if (allModulesOk) {
  console.log('✅ All checks passed! Ready for deployment.');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please resolve issues before deployment.');
  process.exit(1);
}
