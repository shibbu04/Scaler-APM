// Frontend configuration
const CONFIG = {
  // Detect environment and set API base URL
  API_BASE_URL: (() => {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000/api';
    } else if (hostname.includes('vercel.app')) {
      return 'https://scaler-apm.onrender.com/api';
    } else {
      return window.location.origin + '/api';
    }
  })(),
  
  // Analytics
  GOOGLE_ANALYTICS_ID: 'G-HTWFSZ8WNJ',
  
  // Features
  FEATURES: {
    CHATBOT_ENABLED: true,
    ANALYTICS_ENABLED: true,
    EMAIL_CAPTURE_ENABLED: true,
    BOOKING_ENABLED: true
  },
  
  // UI Configuration
  UI: {
    COMPANY_NAME: 'Scaler Academy',
    SUPPORT_EMAIL: 'support@scaler.com',
    SUPPORT_PHONE: '+1-800-SCALER'
  }
};

// Make config globally available
window.CONFIG = CONFIG;
