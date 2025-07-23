// Analytics and tracking functionality
class AnalyticsTracker {
    constructor() {
        // Use global CONFIG if available, otherwise fallback
        this.apiBaseUrl = window.CONFIG?.API_BASE_URL || (
            window.location.hostname === 'localhost' 
                ? 'http://localhost:3000/api'
                : 'https://scaler-apm.onrender.com/api'
        );
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        this.events = [];
        this.pageStartTime = Date.now();
        
        this.init();
    }

    init() {
        this.setupPageTracking();
        this.setupScrollTracking();
        this.setupClickTracking();
        this.setupFormTracking();
        this.setupEngagementTracking();
        this.setupPerformanceTracking();
    }

    setupPageTracking() {
        // Track initial page load
        this.trackEvent('page_load', {
            url: window.location.href,
            title: document.title,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        });

        // Track page unload
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Date.now() - this.pageStartTime;
            this.trackEvent('page_unload', {
                timeOnPage: Math.round(timeOnPage / 1000), // seconds
                scrollDepth: this.getMaxScrollDepth()
            });
            
            // Send any pending events
            this.flush();
        });

        // Track back/forward navigation
        window.addEventListener('popstate', () => {
            this.trackEvent('navigation', {
                type: 'popstate',
                url: window.location.href
            });
        });
    }

    setupScrollTracking() {
        let maxScrollDepth = 0;
        let scrollMilestones = [25, 50, 75, 90, 100];
        let trackedMilestones = [];

        const trackScrollDepth = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = Math.round((scrollTop / docHeight) * 100);

            if (scrollPercent > maxScrollDepth) {
                maxScrollDepth = scrollPercent;
            }

            // Track milestone achievements
            scrollMilestones.forEach(milestone => {
                if (scrollPercent >= milestone && !trackedMilestones.includes(milestone)) {
                    trackedMilestones.push(milestone);
                    this.trackEvent('scroll_milestone', {
                        milestone: milestone,
                        timeToMilestone: Date.now() - this.pageStartTime
                    });
                }
            });
        };

        // Throttled scroll tracking
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            scrollTimeout = setTimeout(trackScrollDepth, 100);
        });
    }

    setupClickTracking() {
        document.addEventListener('click', (event) => {
            const element = event.target;
            const tagName = element.tagName.toLowerCase();
            
            // Track button clicks
            if (tagName === 'button' || element.classList.contains('btn')) {
                this.trackEvent('button_click', {
                    buttonText: element.textContent.trim(),
                    buttonClass: element.className,
                    buttonId: element.id,
                    position: this.getElementPosition(element)
                });
            }
            
            // Track link clicks
            if (tagName === 'a') {
                this.trackEvent('link_click', {
                    linkText: element.textContent.trim(),
                    linkUrl: element.href,
                    linkTarget: element.target,
                    isExternal: this.isExternalLink(element.href)
                });
            }
            
            // Track CTA interactions
            if (element.classList.contains('cta') || element.closest('.cta-section')) {
                this.trackEvent('cta_interaction', {
                    ctaText: element.textContent.trim(),
                    ctaLocation: this.getCTALocation(element)
                });
            }
        });
    }

    setupFormTracking() {
        // Track form submissions
        document.addEventListener('submit', (event) => {
            const form = event.target;
            const formData = new FormData(form);
            const formFields = Array.from(formData.keys());
            
            this.trackEvent('form_submit', {
                formId: form.id,
                formClass: form.className,
                fields: formFields,
                fieldCount: formFields.length
            });
        });

        // Track form field interactions
        document.addEventListener('focus', (event) => {
            if (event.target.matches('input, textarea, select')) {
                this.trackEvent('form_field_focus', {
                    fieldName: event.target.name,
                    fieldType: event.target.type,
                    fieldId: event.target.id
                });
            }
        }, true);

        // Track form abandonment
        let formStartTimes = new Map();
        
        document.addEventListener('input', (event) => {
            if (event.target.matches('input, textarea, select')) {
                const form = event.target.closest('form');
                if (form && !formStartTimes.has(form)) {
                    formStartTimes.set(form, Date.now());
                }
            }
        });

        window.addEventListener('beforeunload', () => {
            formStartTimes.forEach((startTime, form) => {
                if (!form.checkValidity() || this.hasEmptyRequiredFields(form)) {
                    this.trackEvent('form_abandonment', {
                        formId: form.id,
                        timeSpent: Date.now() - startTime,
                        completionRate: this.getFormCompletionRate(form)
                    });
                }
            });
        });
    }

    setupEngagementTracking() {
        // Track time spent on page
        setInterval(() => {
            if (!document.hidden) {
                this.trackEvent('engagement_ping', {
                    timeOnPage: Math.round((Date.now() - this.pageStartTime) / 1000),
                    isActive: this.isUserActive()
                });
            }
        }, 30000); // Every 30 seconds

        // Track user activity
        let lastActivity = Date.now();
        let isActive = true;

        const updateActivity = () => {
            lastActivity = Date.now();
            if (!isActive) {
                isActive = true;
                this.trackEvent('user_active');
            }
        };

        document.addEventListener('mousemove', updateActivity);
        document.addEventListener('keypress', updateActivity);
        document.addEventListener('scroll', updateActivity);
        document.addEventListener('click', updateActivity);

        // Check for inactivity
        setInterval(() => {
            if (Date.now() - lastActivity > 60000 && isActive) { // 1 minute
                isActive = false;
                this.trackEvent('user_inactive');
            }
        }, 10000);

        // Track page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden');
            } else {
                this.trackEvent('page_visible');
            }
        });
    }

    setupPerformanceTracking() {
        // Track page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    this.trackEvent('page_performance', {
                        loadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart),
                        domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
                        firstByte: Math.round(perfData.responseStart - perfData.fetchStart),
                        dnsTime: Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
                        connectTime: Math.round(perfData.connectEnd - perfData.connectStart)
                    });
                }
            }, 0);
        });

        // Track resource loading errors
        window.addEventListener('error', (event) => {
            this.trackEvent('resource_error', {
                type: 'resource',
                source: event.target.src || event.target.href,
                message: event.message,
                filename: event.filename,
                line: event.lineno
            });
        });

        // Track JavaScript errors
        window.addEventListener('unhandledrejection', (event) => {
            this.trackEvent('javascript_error', {
                type: 'unhandled_promise_rejection',
                message: event.reason.toString(),
                stack: event.reason.stack
            });
        });
    }

    trackEvent(eventName, properties = {}) {
        const event = {
            event: eventName,
            properties: {
                ...properties,
                sessionId: this.sessionId,
                userId: this.userId,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                screenResolution: `${screen.width}x${screen.height}`,
                viewportSize: `${window.innerWidth}x${window.innerHeight}`,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };

        this.events.push(event);

        // Send to Google Analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, properties);
        }

        // Send to other analytics platforms
        this.sendToAnalyticsPlatforms(event);

        // Auto-flush events periodically
        if (this.events.length >= 10) {
            this.flush();
        }

        // Log for debugging
        console.log('📊 Event tracked:', eventName, properties);
    }

    sendToAnalyticsPlatforms(event) {
        // Send to custom analytics endpoint
        if (this.events.length % 5 === 0) { // Batch send every 5 events
            this.sendToServer();
        }

        // Send to Facebook Pixel if available
        if (typeof fbq !== 'undefined') {
            fbq('track', 'CustomEvent', {
                event_name: event.event,
                ...event.properties
            });
        }

        // Send to Mixpanel if available
        if (typeof mixpanel !== 'undefined') {
            mixpanel.track(event.event, event.properties);
        }
    }

    async sendToServer() {
        try {
            await fetch(`${this.apiBaseUrl}/analytics/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    events: this.events.slice(-5) // Send last 5 events
                })
            });
        } catch (error) {
            console.error('Failed to send analytics to server:', error);
        }
    }

    flush() {
        if (this.events.length > 0) {
            // Send all remaining events
            this.sendToServer();
            
            // Store in localStorage as backup
            localStorage.setItem('analytics_events', JSON.stringify(this.events));
            
            // Clear events array
            this.events = [];
        }
    }

    // Helper methods
    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    getUserId() {
        let userId = localStorage.getItem('scaler_user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            localStorage.setItem('scaler_user_id', userId);
        }
        return userId;
    }

    getMaxScrollDepth() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        return Math.round((scrollTop / docHeight) * 100);
    }

    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: Math.round(rect.left + window.pageXOffset),
            y: Math.round(rect.top + window.pageYOffset)
        };
    }

    isExternalLink(url) {
        try {
            const link = new URL(url);
            return link.hostname !== window.location.hostname;
        } catch {
            return false;
        }
    }

    getCTALocation(element) {
        // Determine which section the CTA is in
        const sections = ['hero', 'career-paths', 'success-stories', 'cta-section', 'footer'];
        
        for (const section of sections) {
            if (element.closest(`.${section}`)) {
                return section;
            }
        }
        
        return 'unknown';
    }

    isUserActive() {
        return !document.hidden && Date.now() - this.lastActivity < 60000;
    }

    hasEmptyRequiredFields(form) {
        const requiredFields = form.querySelectorAll('[required]');
        return Array.from(requiredFields).some(field => !field.value.trim());
    }

    getFormCompletionRate(form) {
        const allFields = form.querySelectorAll('input, textarea, select');
        const filledFields = Array.from(allFields).filter(field => field.value.trim());
        return Math.round((filledFields.length / allFields.length) * 100);
    }

    // Public methods for manual tracking
    trackConversion(conversionType, value = 0) {
        this.trackEvent('conversion', {
            type: conversionType,
            value: value,
            currency: 'USD'
        });
    }

    trackLeadGeneration(leadData) {
        this.trackEvent('lead_generated', {
            email: leadData.email,
            source: leadData.source,
            careerGoal: leadData.careerGoal
        });
    }

    trackBooking(bookingData) {
        this.trackEvent('booking_completed', {
            bookingId: bookingData.id,
            scheduledTime: bookingData.scheduledTime,
            eventType: bookingData.eventType
        });
    }

    setUserProperties(properties) {
        // Send user properties to analytics platforms
        if (typeof gtag !== 'undefined') {
            gtag('config', 'GA_MEASUREMENT_ID', {
                custom_map: properties
            });
        }

        if (typeof mixpanel !== 'undefined') {
            mixpanel.people.set(properties);
        }

        // Store user properties
        localStorage.setItem('user_properties', JSON.stringify(properties));
    }
}

// Initialize analytics when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.analytics = new AnalyticsTracker();
});

// Enhanced error tracking
window.addEventListener('error', (event) => {
    if (window.analytics) {
        window.analytics.trackEvent('javascript_error', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack
        });
    }
});

// Track AJAX errors
const originalFetch = window.fetch;
window.fetch = function(...args) {
    return originalFetch.apply(this, args)
        .then(response => {
            if (!response.ok && window.analytics) {
                window.analytics.trackEvent('api_error', {
                    url: args[0],
                    status: response.status,
                    statusText: response.statusText
                });
            }
            return response;
        })
        .catch(error => {
            if (window.analytics) {
                window.analytics.trackEvent('network_error', {
                    url: args[0],
                    error: error.message
                });
            }
            throw error;
        });
};

// Expose analytics globally
window.AnalyticsTracker = AnalyticsTracker;
