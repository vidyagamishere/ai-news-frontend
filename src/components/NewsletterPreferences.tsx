import React, { useState, useEffect } from 'react';
import { Mail, MailCheck, MailX, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
// import { apiService } from '../services/api';
import './NewsletterPreferences.css';

interface NewsletterPreferencesProps {
  compact?: boolean;
}

const NewsletterPreferences: React.FC<NewsletterPreferencesProps> = ({ compact = false }) => {
  const { user, updatePreferences } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [manuallyUpdated, setManuallyUpdated] = useState(false);

  useEffect(() => {
    // Initialize subscription status from user preferences
    if (user?.preferences && !manuallyUpdated) {
      const newSubscriptionStatus = user.preferences.newsletter_subscribed || false;
      console.log('🔄 useEffect triggered - User preferences changed');
      console.log('🔄 User preferences:', user.preferences);
      console.log('🔄 New subscription status from user:', newSubscriptionStatus);
      console.log('🔄 Current isSubscribed state:', isSubscribed);
      console.log('🔄 manuallyUpdated flag:', manuallyUpdated);
      
      if (newSubscriptionStatus !== isSubscribed) {
        console.log('⚠️ useEffect is changing subscription status from', isSubscribed, 'to', newSubscriptionStatus);
      }
      
      setIsSubscribed(newSubscriptionStatus);
    } else if (manuallyUpdated) {
      console.log('🔒 useEffect blocked by manuallyUpdated flag');
      // Reset the flag after a short delay to allow future automatic updates
      setTimeout(() => {
        console.log('🔓 Resetting manuallyUpdated flag');
        setManuallyUpdated(false);
      }, 2000);
    }
  }, [user, manuallyUpdated]);

  // Add a separate effect to track isSubscribed changes
  useEffect(() => {
    console.log('📊 isSubscribed state changed to:', isSubscribed);
  }, [isSubscribed]);

  const [frequency, setFrequency] = useState(user?.preferences?.newsletter_frequency || 'weekly');

  const frequencyOptions = [
    { value: 'daily', label: 'Daily', description: 'Get daily AI news digest every morning', icon: '📰' },
    { value: 'weekly', label: 'Weekly', description: 'Weekly summary of top AI developments', icon: '📊' },
    { value: 'monthly', label: 'Monthly', description: 'Monthly comprehensive AI trends report', icon: '📈' }
  ];

  const handleSubscriptionToggle = async () => {
    if (!user) return;

    const targetSubscriptionStatus = !isSubscribed;
    
    console.log('🔄 Starting subscription toggle', { 
      current: isSubscribed, 
      target: targetSubscriptionStatus 
    });

    setLoading(true);
    setMessage(null);

    try {
      // Update user preferences with frequency
      const newPreferences = {
        ...user.preferences,
        newsletter_subscribed: targetSubscriptionStatus,
        newsletter_frequency: frequency,
        email_notifications: true // Ensure email notifications are enabled
      };

      console.log('🔄 Updating preferences:', newPreferences);

      // Call API to update preferences
      const updatedUser = await updatePreferences(newPreferences);
      console.log('✅ API returned updated user:', updatedUser);
      
      // Verify the subscription status from the returned user
      const actualSubscriptionStatus = (updatedUser as any)?.preferences?.newsletter_subscribed;
      console.log('📧 Actual subscription status from API:', actualSubscriptionStatus);
      
      // If API returned undefined, use the target status we wanted to set
      const finalSubscriptionStatus = actualSubscriptionStatus !== undefined ? actualSubscriptionStatus : targetSubscriptionStatus;
      
      console.log('📧 Using final subscription status:', finalSubscriptionStatus);
      
      // Update local state - use final status
      setIsSubscribed(finalSubscriptionStatus);
      setManuallyUpdated(true); // Prevent useEffect from overriding this change
      
      setMessage(
        finalSubscriptionStatus 
          ? '✅ Subscribed to AI News Newsletter!' 
          : '📧 Unsubscribed from newsletter'
      );

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      console.error('❌ Failed to update newsletter preferences:', error);
      setMessage(`❌ Failed to update preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
      console.log('🔄 Subscription toggle completed. Final state:', isSubscribed);
    }
  };

  const handleFrequencyChange = async (newFrequency: 'daily' | 'weekly' | 'monthly') => {
    if (!user) return;

    setFrequency(newFrequency);
    
    // Auto-save frequency if user is subscribed
    if (isSubscribed) {
      try {
        const newPreferences = {
          ...user.preferences,
          newsletter_frequency: newFrequency
        };
        await updatePreferences(newPreferences);
        setMessage('📅 Newsletter frequency updated!');
        setTimeout(() => setMessage(null), 2000);
      } catch (error) {
        console.error('Failed to update frequency:', error);
        setMessage('❌ Failed to update frequency');
        setTimeout(() => setMessage(null), 3000);
      }
    }
  };

  if (!user) {
    return null;
  }

  if (compact) {
    return (
      <div className="newsletter-preferences-compact">
        <button
          className={`newsletter-toggle-btn ${isSubscribed ? 'subscribed' : ''}`}
          onClick={handleSubscriptionToggle}
          disabled={loading}
        >
          {loading ? (
            <div className="spinner" />
          ) : isSubscribed ? (
            <MailCheck size={16} />
          ) : (
            <Mail size={16} />
          )}
          <span>{isSubscribed ? 'Newsletter On' : 'Newsletter Off'}</span>
        </button>
        {message && <div className="message compact">{message}</div>}
      </div>
    );
  }

  return (
    <div className="newsletter-preferences">
      <div className="newsletter-header">
        <div className="newsletter-icon">
          <Mail size={24} />
        </div>
        <div className="newsletter-info">
          <h3>AI News Newsletter</h3>
          <p>Get curated AI news delivered to your inbox with customizable frequency</p>
        </div>
      </div>

      <div className="newsletter-features">
        <div className="feature">
          <span className="feature-icon">🤖</span>
          <span>AI-enhanced article summaries</span>
        </div>
        <div className="feature">
          <span className="feature-icon">📊</span>
          <span>Significance scoring for prioritized reading</span>
        </div>
        <div className="feature">
          <span className="feature-icon">📄</span>
          <span>Beautiful PDF format for offline reading</span>
        </div>
        <div className="feature">
          <span className="feature-icon">🌐</span>
          <span>Comprehensive coverage from 45+ AI sources</span>
        </div>
      </div>

      <div className="newsletter-control">
        <div className="subscription-status">
          <div className={`status-indicator ${isSubscribed ? 'active' : ''}`}>
            {isSubscribed ? <MailCheck size={20} /> : <MailX size={20} />}
          </div>
          <div className="status-text">
            <strong>
              {isSubscribed ? 'Subscribed' : 'Not Subscribed'}
            </strong>
            <p>
              {isSubscribed 
                ? `You'll receive newsletters ${frequency === 'daily' ? 'daily' : frequency === 'weekly' ? 'weekly' : 'monthly'}`
                : 'Subscribe to get AI news delivered to your inbox'
              }
            </p>
          </div>
        </div>

        {/* Newsletter Frequency Selection */}
        {isSubscribed && (
          <div className="frequency-selection">
            <h4>📅 Delivery Frequency</h4>
            <div className="frequency-options">
              {frequencyOptions.map((option) => (
                <label key={option.value} className={`frequency-option ${frequency === option.value ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="newsletter-frequency"
                    value={option.value}
                    checked={frequency === option.value}
                    onChange={(e) => handleFrequencyChange(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  />
                  <div className="option-content">
                    <div className="option-header">
                      <span className="option-icon">{option.icon}</span>
                      <strong>{option.label}</strong>
                    </div>
                    <span className="option-description">{option.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          className={`newsletter-action-btn ${isSubscribed ? 'unsubscribe' : 'subscribe'}`}
          onClick={handleSubscriptionToggle}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner" />
              <span>Updating...</span>
            </>
          ) : isSubscribed ? (
            <>
              <MailX size={18} />
              <span>Unsubscribe</span>
            </>
          ) : (
            <>
              <MailCheck size={18} />
              <span>Subscribe</span>
            </>
          )}
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('Failed') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="newsletter-footer">
        <p>
          <Settings size={14} />
          You can unsubscribe at any time from the email or by toggling this setting
        </p>
      </div>
    </div>
  );
};

export default NewsletterPreferences;