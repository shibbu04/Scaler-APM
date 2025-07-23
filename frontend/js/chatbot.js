// Chatbot functionality
class ChatbotWidget {
    constructor() {
        // Use global CONFIG if available, otherwise fallback
        this.apiBaseUrl = window.CONFIG?.API_BASE_URL || (
            window.location.hostname === 'localhost' 
                ? 'http://localhost:3000/api'
                : 'https://scaler-apm.onrender.com/api'
        );
        this.isOpen = false;
        this.leadData = null;
        this.sessionId = this.generateSessionId();
        this.messageHistory = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadBotConfiguration();
        this.initializeChat();
    }

    setupEventListeners() {
        // Chatbot trigger
        document.getElementById('chatbot-trigger')?.addEventListener('click', () => {
            this.toggle();
        });

        // Close button
        document.getElementById('close-chat')?.addEventListener('click', () => {
            this.close();
        });

        // Send message
        document.getElementById('send-message')?.addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key to send
        document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Quick replies
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-reply')) {
                const message = e.target.dataset.reply;
                this.sendUserMessage(message);
            }
        });
    }

    async loadBotConfiguration() {
        try {
            const response = await this.apiCall('/chatbot/bot-config');
            this.config = response;
        } catch (error) {
            console.error('Failed to load bot configuration:', error);
            this.config = this.getDefaultConfig();
        }
    }

    initializeChat() {
        // Load existing conversation from sessionStorage
        const stored = sessionStorage.getItem('chatbot_conversation');
        if (stored) {
            try {
                this.messageHistory = JSON.parse(stored);
                this.renderMessages();
            } catch (error) {
                console.error('Error loading chat history:', error);
            }
        }

        // Load lead data if available
        const leadData = localStorage.getItem('scaler_lead_data');
        if (leadData) {
            try {
                this.leadData = JSON.parse(leadData);
            } catch (error) {
                console.error('Error loading lead data:', error);
            }
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        const chatWindow = document.getElementById('chatbot-window');
        const trigger = document.getElementById('chatbot-trigger');
        
        if (chatWindow && trigger) {
            chatWindow.classList.add('active');
            trigger.style.display = 'none';
            this.isOpen = true;
            
            // Track opening
            this.trackEvent('chatbot_opened');
            
            // Mark as interacted
            if (window.app) {
                window.app.setInteracted();
            }
            
            // Focus input
            setTimeout(() => {
                document.getElementById('chat-input')?.focus();
            }, 100);
        }
    }

    close() {
        const chatWindow = document.getElementById('chatbot-window');
        const trigger = document.getElementById('chatbot-trigger');
        
        if (chatWindow && trigger) {
            chatWindow.classList.remove('active');
            trigger.style.display = 'flex';
            this.isOpen = false;
            
            this.trackEvent('chatbot_closed');
        }
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input?.value.trim();
        
        if (!message) return;
        
        // Clear input
        input.value = '';
        
        // Send user message
        this.sendUserMessage(message);
    }

    async sendUserMessage(message) {
        // Add user message to UI
        this.addMessage('user', message);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Get bot response
            const response = await this.getBotResponse(message);
            
            // Remove typing indicator
            this.hideTypingIndicator();
            
            // Add bot response
            this.addMessage('bot', response.response, response.actions);
            
            // Handle actions
            if (response.actions && response.actions.length > 0) {
                this.handleActions(response.actions);
            }
            
            // Save lead ID if provided
            if (response.leadId) {
                this.leadId = response.leadId;
            }
            
        } catch (error) {
            console.error('Chat error:', error);
            this.hideTypingIndicator();
            this.addMessage('bot', "I'm sorry, I'm having technical difficulties. Please try again or book a call with our team.");
        }
        
        // Save conversation
        this.saveConversation();
        
        // Track message
        this.trackEvent('chatbot_message_sent', { message: message.substring(0, 100) });
    }

    async getBotResponse(message) {
        const payload = {
            message,
            sessionId: this.sessionId,
            email: this.leadData?.email,
            userInfo: this.leadData || {},
            context: {
                source: 'blog',
                page: window.location.pathname,
                utmSource: this.getUrlParam('utm_source'),
                utmMedium: this.getUrlParam('utm_medium'),
                utmCampaign: this.getUrlParam('utm_campaign'),
                referrerUrl: document.referrer
            }
        };

        return await this.apiCall('/chatbot/interact', 'POST', payload);
    }

    addMessage(sender, content, actions = null) {
        const messagesContainer = document.getElementById('chatbot-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender === 'user' ? 'user-message' : 'bot-message'}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? '👤' : '🤖';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageText = document.createElement('p');
        messageText.textContent = content;
        messageContent.appendChild(messageText);
        
        // Add actions/quick replies for bot messages
        if (sender === 'bot' && actions && actions.length > 0) {
            const actionsDiv = this.createActionButtons(actions);
            if (actionsDiv) {
                messageContent.appendChild(actionsDiv);
            }
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Add to message history
        this.messageHistory.push({
            sender,
            content,
            actions,
            timestamp: new Date().toISOString()
        });
        
        // Animate message
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        setTimeout(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 10);
    }

    createActionButtons(actions) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'chatbot-actions';
        actionsDiv.style.marginTop = '0.5rem';
        
        actions.forEach(action => {
            if (action.type === 'show_options') {
                const quickReplies = document.createElement('div');
                quickReplies.className = 'quick-replies';
                
                action.data.options.forEach(option => {
                    const button = document.createElement('button');
                    button.className = 'quick-reply';
                    button.dataset.reply = option;
                    button.textContent = option;
                    quickReplies.appendChild(button);
                });
                
                actionsDiv.appendChild(quickReplies);
            } else if (action.type === 'show_calendar') {
                const bookingBtn = document.createElement('button');
                bookingBtn.className = 'btn btn-primary';
                bookingBtn.textContent = '📅 Book Free Consultation';
                bookingBtn.style.marginTop = '0.5rem';
                bookingBtn.onclick = () => {
                    if (window.app) {
                        window.app.showBookingFlow();
                    }
                    this.trackEvent('chatbot_booking_clicked');
                };
                actionsDiv.appendChild(bookingBtn);
            } else if (action.type === 'collect_email') {
                const emailForm = this.createEmailCaptureForm();
                actionsDiv.appendChild(emailForm);
            }
        });
        
        return actionsDiv.children.length > 0 ? actionsDiv : null;
    }

    createEmailCaptureForm() {
        const formDiv = document.createElement('div');
        formDiv.className = 'inline-form';
        formDiv.style.marginTop = '1rem';
        
        formDiv.innerHTML = `
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <input type="email" placeholder="Your email" class="email-input" style="flex: 1; min-width: 150px; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                <button class="btn btn-primary email-submit" style="padding: 8px 16px;">Send Roadmap</button>
            </div>
        `;
        
        const emailInput = formDiv.querySelector('.email-input');
        const submitBtn = formDiv.querySelector('.email-submit');
        
        submitBtn.onclick = async () => {
            const email = emailInput.value.trim();
            if (!email) {
                alert('Please enter your email');
                return;
            }
            
            try {
                await this.collectUserInfo({ email });
                formDiv.innerHTML = '<p style="color: #10b981; font-size: 0.875rem;">✅ Roadmap sent to your email!</p>';
            } catch (error) {
                alert('Failed to send roadmap. Please try again.');
            }
        };
        
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitBtn.click();
            }
        });
        
        return formDiv;
    }

    async collectUserInfo(userData) {
        try {
            const response = await this.apiCall('/chatbot/collect-info', 'POST', {
                ...userData,
                sessionId: this.sessionId
            });
            
            // Update lead data
            if (response.leadId) {
                this.leadId = response.leadId;
            }
            
            // Send follow-up message
            if (response.followUpMessage) {
                setTimeout(() => {
                    this.addMessage('bot', response.followUpMessage);
                    this.saveConversation();
                }, 1000);
            }
            
            return response;
        } catch (error) {
            console.error('Error collecting user info:', error);
            throw error;
        }
    }

    handleActions(actions) {
        actions.forEach(action => {
            switch (action.type) {
                case 'offer_resource':
                    this.trackEvent('chatbot_resource_offered', { resourceType: action.data.resourceType });
                    break;
                case 'suggest_consultation':
                    this.trackEvent('chatbot_consultation_suggested', { urgency: action.data.urgency });
                    break;
                case 'collect_info':
                    this.trackEvent('chatbot_info_collection', { fields: action.data.fields });
                    break;
            }
        });
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbot-messages');
        if (!messagesContainer) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        // Add typing animation styles
        const style = document.createElement('style');
        style.textContent = `
            .typing-dots {
                display: flex;
                gap: 4px;
                padding: 12px;
            }
            .typing-dots span {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #94a3b8;
                animation: typing 1.4s infinite ease-in-out;
            }
            .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
            .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
            @keyframes typing {
                0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
                40% { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    renderMessages() {
        const messagesContainer = document.getElementById('chatbot-messages');
        if (!messagesContainer) return;

        messagesContainer.innerHTML = '';
        
        this.messageHistory.forEach(msg => {
            this.addMessage(msg.sender, msg.content, msg.actions);
        });
    }

    saveConversation() {
        sessionStorage.setItem('chatbot_conversation', JSON.stringify(this.messageHistory));
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const url = this.apiBaseUrl + endpoint;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }

    trackEvent(eventName, properties = {}) {
        if (window.app) {
            window.app.trackEvent(eventName, {
                ...properties,
                chatSessionId: this.sessionId,
                leadId: this.leadId
            });
        }
    }

    generateSessionId() {
        return 'chat_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    getUrlParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    getDefaultConfig() {
        return {
            welcomeMessage: "Hi! 👋 I'm here to help you accelerate your tech career. What's your biggest goal right now?",
            quickReplies: [
                "Learn Data Engineering",
                "Switch to Tech", 
                "Get Better Job",
                "Skill Assessment"
            ]
        };
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new ChatbotWidget();
});

// Expose chatbot globally
window.ChatbotWidget = ChatbotWidget;
