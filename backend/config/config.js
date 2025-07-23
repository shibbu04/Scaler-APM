// Configuration for different environments
const config = {
  development: {
    FRONTEND_URL: 'http://localhost:3001',
    API_BASE_URL: 'http://localhost:3000',
    BACKEND_URL: 'http://localhost:3000'
  },
  production: {
    FRONTEND_URL: 'https://scaler-apm.vercel.app',
    API_BASE_URL: 'https://scaler-apm.onrender.com',
    BACKEND_URL: 'https://scaler-apm.onrender.com'
  }
};

const env = process.env.NODE_ENV || 'development';

module.exports = config[env];
