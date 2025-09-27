// Google Analytics 4 Integration
export const GA_MEASUREMENT_ID = 'G-1YQ7YS3EYQ';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined' && GA_MEASUREMENT_ID) {
    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(..._args: any[]) {
      window.dataLayer.push(arguments);
    }
    
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
      custom_map: {
        custom_parameter_1: 'user_type',
        custom_parameter_2: 'subscription_tier'
      }
    });

    // Make gtag available globally
    window.gtag = gtag;
  }
};

// Track page views
export const trackPageView = (url: string, title: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      page_title: title
    });
  }
};

// Track custom events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
};

// Track user authentication events
export const trackSignup = (method: 'email' | 'google', userType?: string) => {
  trackEvent('sign_up', 'engagement', method);
  if (userType) {
    trackEvent('user_type_selected', 'user_profile', userType);
  }
};

export const trackLogin = (method: 'email' | 'google') => {
  trackEvent('login', 'engagement', method);
};

// Track newsletter and preferences
export const trackNewsletterSignup = (frequency: string) => {
  trackEvent('newsletter_signup', 'engagement', frequency);
};

export const trackTopicSelection = (topics: string[]) => {
  trackEvent('topic_selection', 'user_profile', topics.join(','));
};

// Track content engagement
export const trackArticleClick = (articleTitle: string, source: string, category?: string) => {
  trackEvent('article_click', 'content', `${source}: ${articleTitle}`);
  if (category) {
    trackEvent('category_engagement', 'content', category);
  }
};

export const trackArticleView = (articleId: string, timeSpent: number) => {
  trackEvent('article_view', 'content', articleId, timeSpent);
};

// Track onboarding completion
export const trackOnboardingStep = (step: number, stepName: string) => {
  trackEvent('onboarding_step', 'user_journey', stepName, step);
};

export const trackOnboardingComplete = (totalTime: number) => {
  trackEvent('onboarding_complete', 'user_journey', 'completed', totalTime);
};

// Track subscription and monetization
export const trackSubscriptionUpgrade = (tier: string, method: string) => {
  trackEvent('subscription_upgrade', 'monetization', tier);
  trackEvent('payment_method', 'monetization', method);
};

// Track search and discovery
export const trackSearch = (query: string, resultsCount: number) => {
  trackEvent('search', 'discovery', query, resultsCount);
};

// Track user preferences
export const trackPreferenceUpdate = (preferenceType: string, value: string) => {
  trackEvent('preference_update', 'user_profile', `${preferenceType}: ${value}`);
};

// Track performance metrics
export const trackPerformance = (metric: string, value: number) => {
  trackEvent('performance', 'technical', metric, value);
};

// Enhanced ecommerce tracking for premium features
export const trackPurchase = (transactionId: string, value: number, currency: string = 'USD') => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: value,
      currency: currency,
      items: [{
        item_id: 'premium_subscription',
        item_name: 'Premium AI News Subscription',
        category: 'Subscription',
        quantity: 1,
        price: value
      }]
    });
  }
};

// Track ad interactions
export const trackAdClick = (adSlot: string, adFormat: string) => {
  trackEvent('ad_click', 'monetization', `${adFormat}_${adSlot}`);
};

export const trackAdImpression = (adSlot: string, adFormat: string) => {
  trackEvent('ad_impression', 'monetization', `${adFormat}_${adSlot}`);
};