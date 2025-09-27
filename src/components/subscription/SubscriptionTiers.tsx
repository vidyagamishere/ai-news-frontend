import React, { useState } from 'react';
import { Check, Star, Zap, Crown, Mail, Calendar, BookOpen, Video, Headphones } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './subscription.css';

interface SubscriptionTiersProps {
  onClose?: () => void;
  showOnlyUpgrade?: boolean;
}

const SubscriptionTiers: React.FC<SubscriptionTiersProps> = ({ onClose, showOnlyUpgrade = false }) => {
  const [loading, setLoading] = useState(false);
  const { user, upgradeSubscription } = useAuth();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await upgradeSubscription();
      if (onClose) onClose();
    } catch (error) {
      console.error('Upgrade failed:', error);
      alert('Upgrade failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const freeFeatures = [
    { icon: Mail, text: 'Weekly AI news digest' },
    { icon: BookOpen, text: 'Access to blog articles' },
    { icon: Headphones, text: 'Podcast recommendations' },
    { icon: Video, text: 'Video content library' },
    { text: 'Basic topic preferences' },
    { text: 'Email notifications' }
  ];

  const premiumFeatures = [
    { icon: Mail, text: 'Daily AI news digest', highlight: true },
    { icon: Calendar, text: 'AI event calendar & alerts', highlight: true },
    { icon: BookOpen, text: 'Premium learning resources', highlight: true },
    { text: 'Advanced topic customization' },
    { text: 'Priority customer support' },
    { text: 'Ad-free experience' },
    { text: 'Export digest to PDF' },
    { text: 'Mobile app access' },
    { text: 'Early access to new features' }
  ];

  if (showOnlyUpgrade && user?.subscriptionTier === 'premium') {
    return (
      <div className="subscription-tiers">
        <div className="upgrade-success">
          <Crown className="success-icon" size={48} />
          <h2>You're already a Premium subscriber!</h2>
          <p>Enjoy all the premium features of AI News Digest</p>
          {onClose && (
            <button onClick={onClose} className="btn btn-primary">
              Continue
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-tiers">
      <div className="subscription-header">
        <h2>Choose Your Plan</h2>
        <p>Get personalized AI news that matters to you</p>
      </div>

      <div className="tiers-grid">
        {/* Free Tier */}
        <div className={`tier-card ${user?.subscriptionTier === 'free' ? 'current' : ''}`}>
          <div className="tier-header">
            <div className="tier-icon">
              <Zap size={24} />
            </div>
            <h3>Free</h3>
            <div className="tier-price">
              <span className="price">$0</span>
              <span className="period">/month</span>
            </div>
            <p className="tier-description">Perfect for staying informed</p>
          </div>

          <div className="tier-features">
            <ul>
              {freeFeatures.map((feature, index) => (
                <li key={index} className="feature-item">
                  <div className="feature-icon">
                    {feature.icon ? <feature.icon size={16} /> : <Check size={16} />}
                  </div>
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="tier-action">
            {user?.subscriptionTier === 'free' ? (
              <button className="btn btn-outline current-plan" disabled>
                Current Plan
              </button>
            ) : (
              <button className="btn btn-outline">
                Get Started
              </button>
            )}
          </div>
        </div>

        {/* Premium Tier */}
        <div className={`tier-card premium ${user?.subscriptionTier === 'premium' ? 'current' : ''}`}>
          <div className="tier-badge">
            <Star size={16} />
            Most Popular
          </div>
          
          <div className="tier-header">
            <div className="tier-icon premium-icon">
              <Crown size={24} />
            </div>
            <h3>Premium</h3>
            <div className="tier-price">
              <span className="price">$9.99</span>
              <span className="period">/month</span>
            </div>
            <p className="tier-description">Everything you need to stay ahead</p>
          </div>

          <div className="tier-features">
            <ul>
              {premiumFeatures.map((feature, index) => (
                <li key={index} className={`feature-item ${feature.highlight ? 'highlight' : ''}`}>
                  <div className="feature-icon">
                    {feature.icon ? <feature.icon size={16} /> : <Check size={16} />}
                  </div>
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="tier-action">
            {user?.subscriptionTier === 'premium' ? (
              <button className="btn btn-primary current-plan" disabled>
                Current Plan
              </button>
            ) : (
              <button 
                onClick={handleUpgrade} 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Upgrading...' : 'Upgrade to Premium'}
              </button>
            )}
          </div>

          {user?.subscriptionTier !== 'premium' && (
            <div className="money-back">
              <p>30-day money-back guarantee</p>
            </div>
          )}
        </div>
      </div>

      {!showOnlyUpgrade && (
        <div className="subscription-footer">
          <div className="faq-section">
            <h3>Frequently Asked Questions</h3>
            <div className="faq-grid">
              <div className="faq-item">
                <h4>Can I change my plan anytime?</h4>
                <p>Yes, you can upgrade or downgrade your subscription at any time.</p>
              </div>
              <div className="faq-item">
                <h4>What's included in the AI event calendar?</h4>
                <p>Get notified about conferences, webinars, product launches, and important AI announcements.</p>
              </div>
              <div className="faq-item">
                <h4>How does the daily digest differ from weekly?</h4>
                <p>Daily digests include breaking news and time-sensitive updates, while weekly focuses on the most important stories.</p>
              </div>
              <div className="faq-item">
                <h4>Do you offer discounts?</h4>
                <p>We offer student discounts and annual subscription savings. Contact us for details.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {onClose && (
        <div className="subscription-actions">
          <button onClick={onClose} className="btn btn-ghost">
            {user ? 'Continue with current plan' : 'Maybe later'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionTiers;