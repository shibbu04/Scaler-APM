// Main application JavaScript
class LeadFunnelApp {
    constructor() {
        this.apiBaseUrl = window.location.origin + '/api';
        this.leadData = {};
        this.sessionId = this.generateSessionId();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.trackPageView();
        this.initializeComponents();
    }

    setupEventListeners() {
        // Navigation CTA buttons
        document.getElementById('nav-book-call')?.addEventListener('click', () => {
            this.trackEvent('nav_book_call_clicked');
            this.showBookingFlow();
        });

        // Hero CTAs
        document.getElementById('hero-chat-btn')?.addEventListener('click', () => {
            this.trackEvent('hero_chat_clicked');
            this.openChatbot();
        });

        document.getElementById('hero-book-call')?.addEventListener('click', () => {
            this.trackEvent('hero_book_call_clicked');
            this.showBookingFlow();
        });

        // Career path cards
        document.querySelectorAll('.path-card').forEach(card => {
            card.addEventListener('click', () => {
                const career = card.dataset.career;
                this.trackEvent('career_path_clicked', { career });
                this.showLeadCaptureModal(career);
            });
        });

        document.querySelectorAll('.path-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const career = btn.closest('.path-card').dataset.career;
                this.trackEvent('career_path_learn_more', { career });
                this.showLeadCaptureModal(career);
            });
        });

        // CTA section buttons
        document.getElementById('cta-chat')?.addEventListener('click', () => {
            this.trackEvent('cta_chat_clicked');
            this.openChatbot();
        });

        document.getElementById('cta-book-call')?.addEventListener('click', () => {
            this.trackEvent('cta_book_call_clicked');
            this.showBookingFlow();
        });

        // Lead capture form
        document.getElementById('lead-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLeadSubmission(e.target);
        });

        // Modal close handlers
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        // Click outside modal to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeChatbot();
            }
        });
    }

    initializeComponents() {
        // Initialize success stories slider
        this.initStoriesSlider();
        
        // Add scroll animations
        this.initScrollAnimations();
        
        // Load any existing lead data from localStorage
        this.loadLeadData();
        
        // Auto-show chatbot notification after delay
        setTimeout(() => {
            this.showChatbotNotification();
        }, 5000);
    }

    initStoriesSlider() {
        const stories = document.querySelectorAll('.story-card');
        let currentStory = 0;

        const rotateStories = () => {
            stories.forEach(story => story.classList.remove('active'));
            stories[currentStory].classList.add('active');
            currentStory = (currentStory + 1) % stories.length;
        };

        // Rotate stories every 5 seconds
        setInterval(rotateStories, 5000);
    }

    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                }
            });
        }, observerOptions);

        // Observe sections for animations
        document.querySelectorAll('.path-card, .story-card, .hero-stats').forEach(el => {
            observer.observe(el);
        });
    }

    showLeadCaptureModal(careerGoal = '') {
        const modal = document.getElementById('lead-modal');
        const careerSelect = document.getElementById('careerGoal');
        
        if (careerGoal && careerSelect) {
            careerSelect.value = careerGoal;
        }
        
        modal.classList.add('active');
        this.trackEvent('lead_modal_opened', { careerGoal });
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    openChatbot() {
        // This will be handled by the chatbot.js file
        if (window.chatbot) {
            window.chatbot.open();
        }
    }

    closeChatbot() {
        if (window.chatbot) {
            window.chatbot.close();
        }
    }

    showChatbotNotification() {
        const trigger = document.getElementById('chatbot-trigger');
        const notification = trigger?.querySelector('.chat-notification');
        
        if (notification && !this.hasInteracted()) {
            // Show notification briefly
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(10px)';
            }, 3000);
        }
    }

    async handleLeadSubmission(form) {
        const formData = new FormData(form);
        const leadData = Object.fromEntries(formData.entries());
        
        // Add tracking data
        leadData.source = 'blog';
        leadData.sessionId = this.sessionId;
        leadData.utmSource = this.getUrlParam('utm_source');
        leadData.utmMedium = this.getUrlParam('utm_medium');
        leadData.utmCampaign = this.getUrlParam('utm_campaign');
        leadData.referrerUrl = document.referrer;

        try {
            this.showLoading(form);
            
            // Create lead
            const response = await this.apiCall('/leads', 'POST', leadData);
            
            if (response.success !== false) {
                this.leadData = response.lead;
                this.saveLeadData();
                
                // Subscribe to email sequence
                await this.subscribeToEmails(leadData);
                
                // Track conversion
                this.trackEvent('lead_captured', leadData);
                
                // Show success and offer next step
                this.showSuccessModal();
                
                // Close lead modal
                this.closeModal();
            } else {
                throw new Error(response.error || 'Failed to submit lead');
            }
        } catch (error) {
            console.error('Lead submission error:', error);
            this.showError('Failed to submit. Please try again.');
        } finally {
            this.hideLoading(form);
        }
    }

    async subscribeToEmails(leadData) {
        try {
            await this.apiCall('/email/subscribe', 'POST', leadData);
        } catch (error) {
            console.error('Email subscription error:', error);
        }
    }

    showSuccessModal() {
        // Create and show success modal
        const successHtml = `
            <div class="modal active" id="success-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🎉 Welcome to Your Journey!</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Thanks ${this.leadData.firstName}! I've sent your personalized career roadmap to your email.</p>
                        <p><strong>What's next?</strong></p>
                        <ul>
                            <li>✅ Check your email for the roadmap</li>
                            <li>📞 Book a free consultation with our experts</li>
                            <li>💬 Chat with our AI career assistant</li>
                        </ul>
                        <div style="margin-top: 2rem;">
                            <button class="btn btn-primary btn-block" onclick="app.showBookingFlow()">
                                Book Free Consultation Call
                            </button>
                            <button class="btn btn-secondary btn-block" onclick="app.openChatbot()" style="margin-top: 1rem;">
                                Continue Chatting
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', successHtml);
        
        // Add close event listener
        document.querySelector('#success-modal .modal-close').addEventListener('click', () => {
            document.getElementById('success-modal').remove();
        });
    }

    showBookingFlow() {
        // Open Calendly or booking modal
        if (window.Calendly) {
            Calendly.initPopupWidget({
                url: 'https://calendly.com/scaler-careers/consultation'
            });
        } else {
            // Fallback to external link
            window.open('https://calendly.com/scaler-careers/consultation', '_blank');
        }
        
        this.trackEvent('booking_flow_opened');
    }

    showLoading(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';
        }
        form.classList.add('loading');
    }

    hideLoading(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Get My Roadmap';
        }
        form.classList.remove('loading');
    }

    showError(message) {
        // Simple error display
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-toast';
        errorDiv.innerHTML = `
            <div style="background: #ef4444; color: white; padding: 1rem; border-radius: 8px; position: fixed; top: 20px; right: 20px; z-index: 3000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                ${message}
                <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; float: right; margin-left: 1rem; cursor: pointer;">&times;</button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
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
        return await response.json();
    }

    trackEvent(eventName, properties = {}) {
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                custom_parameter_1: properties.career || '',
                custom_parameter_2: properties.source || '',
                ...properties
            });
        }

        // Custom analytics
        if (window.analytics) {
            window.analytics.track(eventName, {
                sessionId: this.sessionId,
                leadId: this.leadData.id,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                ...properties
            });
        }

        console.log('Event tracked:', eventName, properties);
    }

    trackPageView() {
        this.trackEvent('page_view', {
            page: window.location.pathname,
            title: document.title,
            referrer: document.referrer
        });
    }

    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    getUrlParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    hasInteracted() {
        return localStorage.getItem('scaler_interacted') === 'true';
    }

    setInteracted() {
        localStorage.setItem('scaler_interacted', 'true');
    }

    saveLeadData() {
        localStorage.setItem('scaler_lead_data', JSON.stringify(this.leadData));
    }

    loadLeadData() {
        const stored = localStorage.getItem('scaler_lead_data');
        if (stored) {
            try {
                this.leadData = JSON.parse(stored);
            } catch (error) {
                console.error('Error loading lead data:', error);
            }
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LeadFunnelApp();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.app) {
        // Track return to page
        window.app.trackEvent('page_focused');
    }
});

// Handle before page unload
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.trackEvent('page_exit');
    }
});

// Expose app globally for debugging
window.LeadFunnelApp = LeadFunnelApp;
