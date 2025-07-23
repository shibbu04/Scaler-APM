@echo off
REM AI Lead Conversion Funnel - Windows Setup Script

echo 🚀 Setting up AI Lead Conversion Funnel...

REM Check if we're in the right directory
if not exist "backend\server.js" (
    echo ❌ Error: Please run this script from the project root directory
    exit /b 1
)

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install
cd ..

echo ✅ Setup complete!
echo.
echo 📋 Quick Start Guide:
echo 1. Update backend\.env with your API keys
echo 2. Start MongoDB: mongod
echo 3. Start backend: cd backend ^&^& npm run dev
echo 4. Open http://localhost:3000 in your browser
echo.
echo 🔑 Required API Keys (update in backend\.env):
echo - OPENAI_API_KEY (for AI chatbot)
echo - MAILCHIMP_API_KEY (for email marketing)
echo - CALENDLY_API_TOKEN (for booking)
echo - GOOGLE_ANALYTICS_ID (for analytics)
echo.
echo 📊 MongoDB Setup:
echo - Default: mongodb://localhost:27017/scaler-funnel
echo - For cloud: Update MONGODB_URI in .env
echo.
echo 🎯 Ready to capture leads!
pause
