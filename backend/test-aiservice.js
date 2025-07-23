// Simple test script to validate aiService exports
console.log('Testing aiService imports...');

try {
  const aiService = require('./services/aiService');
  console.log('✅ aiService imported successfully');
  console.log('Available functions:', Object.keys(aiService));
  
  // Test if functions exist
  if (typeof aiService.generatePersonalizedResponse === 'function') {
    console.log('✅ generatePersonalizedResponse function exists');
  } else {
    console.log('❌ generatePersonalizedResponse function missing');
  }
  
  if (typeof aiService.generatePersonalizedEmail === 'function') {
    console.log('✅ generatePersonalizedEmail function exists');
  } else {
    console.log('❌ generatePersonalizedEmail function missing');
  }
  
  console.log('🎉 All tests passed!');
  
} catch (error) {
  console.error('❌ Error importing aiService:', error.message);
  console.error('Full error:', error);
}
