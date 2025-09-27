import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, User, Mail, Bell, Brain, Settings2, BookOpen, Save, Briefcase, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { ContentType } from '../types/auth';
import Header from '../components/Header';
import NewsletterPreferences from '../components/NewsletterPreferences';
import SEO from '../components/SEO';
import './Preferences.css';

const Preferences: React.FC = () => {
  const { user, updatePreferences } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  // Initialize state from user preferences
  const [selectedTopics, setSelectedTopics] = useState(
    user?.preferences?.topics?.filter(t => t.selected).map(t => t.id) || []
  );
  const [selectedContentTypes, setSelectedContentTypes] = useState(
    user?.preferences?.content_types || ['articles']
  );
  const [emailNotifications, setEmailNotifications] = useState(
    user?.preferences?.email_notifications !== false
  );
  const [breakingNewsAlerts, setBreakingNewsAlerts] = useState(
    user?.preferences?.breaking_news_alerts || false
  );
  const [selectedRole, setSelectedRole] = useState(
    user?.preferences?.role_type || user?.preferences?.user_roles?.[0] || ''
  );
  const [selectedExperience, setSelectedExperience] = useState(
    user?.preferences?.experience_level || ''
  );

  const availableTopics = user?.preferences?.topics || [];
  const contentTypes = [
    { id: 'articles', name: 'Articles', description: 'In-depth analysis and news', icon: '📄' },
    { id: 'podcasts', name: 'Podcasts', description: 'Audio content and interviews', icon: '🎙️' },
    { id: 'videos', name: 'Videos', description: 'Visual content and tutorials', icon: '🎥' },
    { id: 'events', name: 'Events', description: 'Conferences and webinars', icon: '📅' },
    { id: 'learning', name: 'Learning', description: 'Courses and educational resources', icon: '🎓' },
    { id: 'demos', name: 'Demos', description: 'Interactive demonstrations and showcases', icon: '🎮' }
  ];

  const experienceLevels = [
    { id: 'beginner', name: 'Beginner', description: 'New to AI, want to learn basics', icon: '🌱' },
    { id: 'intermediate', name: 'Intermediate', description: 'Some AI knowledge, want to stay updated', icon: '🚀' },
    { id: 'advanced', name: 'Advanced', description: 'AI professional, need cutting-edge insights', icon: '⚡' },
    { id: 'expert', name: 'Expert', description: 'AI researcher/leader, need comprehensive coverage', icon: '🎯' }
  ];

  const roleTypes = [
    { id: 'developer', name: 'Developer', description: 'Software developer interested in AI tools', icon: '💻' },
    { id: 'researcher', name: 'Researcher', description: 'Academic or industry researcher', icon: '🔬' },
    { id: 'executive', name: 'Executive', description: 'Business leader exploring AI opportunities', icon: '👔' },
    { id: 'student', name: 'Student', description: 'Learning AI/ML concepts and applications', icon: '🎓' },
    { id: 'entrepreneur', name: 'Entrepreneur', description: 'Building AI-powered products or services', icon: '🚀' },
    { id: 'enthusiast', name: 'Enthusiast', description: 'Passionate about AI developments', icon: '❤️' }
  ];

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleContentTypeToggle = (contentType: string) => {
    setSelectedContentTypes(prev => 
      prev.includes(contentType) 
        ? prev.filter(type => type !== contentType)
        : [...prev, contentType]
    );
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const updatedTopics = availableTopics.map(topic => ({
        ...topic,
        selected: selectedTopics.includes(topic.id)
      }));

      const newPreferences = {
        ...user!.preferences,
        topics: updatedTopics,
        content_types: selectedContentTypes as ContentType[],
        email_notifications: emailNotifications,
        breaking_news_alerts: breakingNewsAlerts,
        role_type: selectedRole,
        user_roles: selectedRole ? [selectedRole] : [],
        experience_level: selectedExperience
      };

      await updatePreferences(newPreferences);
      setMessage('✅ Preferences saved successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setMessage('❌ Failed to save preferences. Please try again.');
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="app">
        <Header onRefresh={() => {}} onManualScrape={() => {}} isLoading={false} />
        <div className="main-content">
          <div className="error-container">
            <p>Please log in to access preferences.</p>
            <Link to="/auth" className="btn btn-primary">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app authenticated-app">
      <SEO 
        title="Preferences | AI News Intelligence"
        description="Manage your AI news preferences, newsletter subscriptions, and account settings."
        url="/preferences"
      />
      <Header onRefresh={() => {}} onManualScrape={() => {}} isLoading={false} />
      
      <main className="main-content">
        <div className="main-content-contained">
          <div className="preferences-header">
            <Link to="/dashboard" className="back-link">
              <ChevronLeft size={16} />
              Back to Dashboard
            </Link>
            <h1>Preferences</h1>
            <p>Manage your AI news experience and account settings</p>
          </div>

          <div className="preferences-container">
            {/* User Information Section */}
            <div className="preferences-section">
              <div className="section-header">
                <User size={20} />
                <h2>Account Information</h2>
              </div>
              <div className="user-info-card">
                <div className="user-avatar">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="Profile" />
                  ) : (
                    <div className="avatar-placeholder">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="user-details">
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                  <div className="subscription-badge">
                    {user.subscriptionTier === 'premium' ? (
                      <span className="premium-badge">Premium Member</span>
                    ) : (
                      <span className="free-badge">Free Account</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Newsletter Preferences Section */}
            <div className="preferences-section">
              <div className="section-header">
                <Mail size={20} />
                <h2>Newsletter Preferences</h2>
              </div>
              <NewsletterPreferences />
            </div>

            {/* AI Interest Topics Section */}
            <div className="preferences-section">
              <div className="section-header">
                <Brain size={20} />
                <h2>AI Interest Areas</h2>
              </div>
              <p className="section-description">
                Select topics you're interested in to personalize your AI news feed
              </p>
              <div className="topics-grid">
                {availableTopics.map(topic => (
                  <button
                    key={topic.id}
                    className={`topic-card ${selectedTopics.includes(topic.id) ? 'selected' : ''}`}
                    onClick={() => handleTopicToggle(topic.id)}
                  >
                    <span className="topic-name">{topic.name}</span>
                    <span className="topic-category">{topic.category}</span>
                    {selectedTopics.includes(topic.id) && (
                      <span className="topic-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Professional Role Section */}
            <div className="preferences-section">
              <div className="section-header">
                <Briefcase size={20} />
                <h2>Professional Role</h2>
              </div>
              <p className="section-description">
                Tell us about your professional background to get more relevant content
              </p>
              <div className="role-grid">
                {roleTypes.map(role => (
                  <button
                    key={role.id}
                    className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
                    onClick={() => setSelectedRole(role.id)}
                  >
                    <span className="role-icon">{role.icon}</span>
                    <div className="role-info">
                      <h4>{role.name}</h4>
                      <p>{role.description}</p>
                    </div>
                    {selectedRole === role.id && (
                      <span className="role-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Level Section */}
            <div className="preferences-section">
              <div className="section-header">
                <Star size={20} />
                <h2>AI Experience Level</h2>
              </div>
              <p className="section-description">
                Help us tailor the complexity and depth of content to your experience
              </p>
              <div className="experience-grid">
                {experienceLevels.map(level => (
                  <button
                    key={level.id}
                    className={`experience-card ${selectedExperience === level.id ? 'selected' : ''}`}
                    onClick={() => setSelectedExperience(level.id)}
                  >
                    <span className="experience-icon">{level.icon}</span>
                    <div className="experience-info">
                      <h4>{level.name}</h4>
                      <p>{level.description}</p>
                    </div>
                    {selectedExperience === level.id && (
                      <span className="experience-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Types Section */}
            <div className="preferences-section">
              <div className="section-header">
                <BookOpen size={20} />
                <h2>Content Types</h2>
              </div>
              <p className="section-description">
                Choose the types of content you want to receive
              </p>
              <div className="content-types-grid">
                {contentTypes.map(contentType => (
                  <button
                    key={contentType.id}
                    className={`content-type-card ${selectedContentTypes.includes(contentType.id) ? 'selected' : ''}`}
                    onClick={() => handleContentTypeToggle(contentType.id)}
                  >
                    <span className="content-type-icon">{contentType.icon}</span>
                    <div className="content-type-info">
                      <h4>{contentType.name}</h4>
                      <p>{contentType.description}</p>
                    </div>
                    {selectedContentTypes.includes(contentType.id) && (
                      <span className="content-type-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Preferences Section */}
            <div className="preferences-section">
              <div className="section-header">
                <Bell size={20} />
                <h2>Notification Preferences</h2>
              </div>
              <div className="notification-settings">
                <div className="setting-item">
                  <div className="setting-info">
                    <strong>Email Notifications</strong>
                    <p>Receive important updates and newsletters</p>
                  </div>
                  <div className="setting-control">
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <strong>Breaking News Alerts</strong>
                    <p>Get notified about major AI breakthroughs immediately</p>
                  </div>
                  <div className="setting-control">
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={breakingNewsAlerts}
                        onChange={(e) => setBreakingNewsAlerts(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Preferences Section */}
            <div className="preferences-section">
              <div className="section-header">
                <Settings2 size={20} />
                <h2>Save Changes</h2>
              </div>
              <div className="save-section">
                {message && (
                  <div className={`message ${message.includes('Failed') ? 'error' : 'success'}`}>
                    {message}
                  </div>
                )}
                <button
                  className="save-preferences-btn"
                  onClick={handleSavePreferences}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Save All Preferences</span>
                    </>
                  )}
                </button>
                <p className="save-note">
                  Your preferences are automatically saved to your account and will be applied to personalize your AI news experience.
                </p>
              </div>
            </div>

            {/* Account Actions */}
            <div className="preferences-section">
              <div className="section-header">
                <h2>Account Actions</h2>
              </div>
              <div className="account-actions">
                <p className="note">
                  Need to update your email or other account details? Contact support or 
                  sign in again with your Google account to refresh your information.
                </p>
                <div className="action-buttons">
                  <Link to="/dashboard" className="btn btn-primary">
                    Back to Dashboard
                  </Link>
                  <Link to="/archive" className="btn btn-secondary">
                    View Archive
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Preferences;