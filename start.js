const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting AI Lead Conversion Funnel...\n');

// Check if .env exists
const envPath = path.join(__dirname, 'backend', '.env');
if (!fs.existsSync(envPath)) {
    console.log('❌ Error: backend/.env file not found!');
    console.log('📋 Please copy backend/.env.example to backend/.env and configure your API keys.\n');
    console.log('Required API keys:');
    console.log('- OPENAI_API_KEY (for AI chatbot)');
    console.log('- MAILCHIMP_API_KEY (for email marketing)');
    console.log('- CALENDLY_API_TOKEN (for booking system)');
    console.log('- GOOGLE_ANALYTICS_ID (for analytics)\n');
    process.exit(1);
}

// Check if node_modules exists in backend
const nodeModulesPath = path.join(__dirname, 'backend', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
    console.log('📦 Installing dependencies...');
    const install = spawn('npm', ['install'], { 
        cwd: path.join(__dirname, 'backend'),
        stdio: 'inherit' 
    });
    
    install.on('close', (code) => {
        if (code === 0) {
            startServer();
        } else {
            console.log('❌ Failed to install dependencies');
            process.exit(1);
        }
    });
} else {
    startServer();
}

function startServer() {
    console.log('🖥️ Starting backend server...');
    console.log('📍 Backend will be available at: http://localhost:3000');
    console.log('🤖 Chatbot widget will be embedded in the frontend');
    console.log('📧 Email automation will be active\n');
    console.log('Press Ctrl+C to stop the server\n');
    
    const server = spawn('npm', ['run', 'dev'], { 
        cwd: path.join(__dirname, 'backend'),
        stdio: 'inherit' 
    });
    
    server.on('close', (code) => {
        console.log(`\n👋 Server stopped with code ${code}`);
    });
}
