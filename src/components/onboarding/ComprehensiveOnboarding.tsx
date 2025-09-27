import React, { useState, useEffect } from 'react';
import { 
  Check, Brain, Cpu, Factory, Shield, Wrench, ArrowRight, ArrowLeft, 
  Mail, Bell, BookOpen, TrendingUp, Star, User
} from 'lucide-react';
import type { AITopic, ContentType } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import './onboarding.css';

const CATEGORY_ICONS = {
  research: Brain,
  language: Cpu,
  platform: Wrench,
  policy: Shield,
  robotics: Factory,
  company: Factory,
  startup: TrendingUp,
  hardware: Cpu,
  automotive: Factory,
  healthcare: Shield,
  finance: TrendingUp,
  gaming: Star,
  creative: Star,
  cloud: Cpu,
  events: BookOpen,
  learning: BookOpen,
  news: Bell,
  international: Factory
};

const CONTENT_TYPES: { id: ContentType; name: string; description: string; icon: string }[] = [
  { id: 'blogs', name: 'Articles', description: 'In-depth analysis and news', icon: '📄' },
  { id: 'podcasts', name: 'Podcasts', description: 'Audio content and interviews', icon: '🎙️' },
  { id: 'videos', name: 'Videos', description: 'Visual content and tutorials', icon: '🎥' },
  { id: 'events', name: 'Events', description: 'Conferences and webinars', icon: '📅' },
  { id: 'learning', name: 'Learning', description: 'Courses and educational resources', icon: '🎓' },
  { id: 'demos', name: 'Demos', description: 'Interactive demonstrations and showcases', icon: '🎮' }
];

const NEWSLETTER_FREQUENCIES = [
  { id: 'daily', name: 'Daily', description: 'Get the latest AI news every day', icon: '📰' },
  { id: 'weekly', name: 'Weekly', description: 'Weekly digest of top AI stories', icon: '📊' },
  { id: 'monthly', name: 'Monthly', description: 'Monthly summary of AI trends', icon: '📈' }
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', name: 'Beginner', description: 'New to AI, want to learn basics', icon: '🌱' },
  { id: 'intermediate', name: 'Intermediate', description: 'Some AI knowledge, want to stay updated', icon: '🚀' },
  { id: 'advanced', name: 'Advanced', description: 'AI professional, need cutting-edge insights', icon: '⚡' },
  { id: 'expert', name: 'Expert', description: 'AI researcher/leader, need comprehensive coverage', icon: '🎯' }
];

const ROLE_TYPES = [
  { id: 'developer', name: 'Developer', description: 'Software developer interested in AI tools', icon: '💻' },
  { id: 'researcher', name: 'Researcher', description: 'Academic or industry researcher', icon: '🔬' },
  { id: 'executive', name: 'Executive', description: 'Business leader exploring AI opportunities', icon: '👔' },
  { id: 'student', name: 'Student', description: 'Learning AI/ML concepts and applications', icon: '🎓' },
  { id: 'entrepreneur', name: 'Entrepreneur', description: 'Building AI-powered products or services', icon: '🚀' },
  { id: 'enthusiast', name: 'Enthusiast', description: 'Passionate about AI developments', icon: '❤️' }
];

interface ComprehensiveOnboardingProps {
  onComplete: () => void;
}

const ComprehensiveOnboarding: React.FC<ComprehensiveOnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Welcome & Experience Level
  const [selectedExperience, setSelectedExperience] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  
  // Step 2: Topics of Interest
  const [availableTopics, setAvailableTopics] = useState<AITopic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  
  // Step 3: Content Preferences
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>(['blogs', 'podcasts', 'videos', 'events', 'learning', 'demos']);
  const [newsletterFrequency, setNewsletterFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  
  // Step 4: Notification Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [breakingNewsAlerts, setBreakingNewsAlerts] = useState(false);

  const { updatePreferences } = useAuth();

  const totalSteps = 4;

  useEffect(() => {
    loadAvailableTopics();
  }, []);

  const loadAvailableTopics = async () => {
    try {
      const topics = await authService.getAvailableTopics();
      setAvailableTopics(topics);
      
      // Pre-select some popular topics based on experience level
      const defaultTopics = topics.filter(t => 
        ['Machine Learning', 'Deep Learning', 'Natural Language Processing'].includes(t.name)
      ).map(t => t.id);
      setSelectedTopics(defaultTopics);
    } catch (error) {
      console.error('Failed to load topics:', error);
      // Provide fallback topics matching backend categories
      setAvailableTopics([
        { id: 'ml_foundations', name: 'Machine Learning', category: 'research', selected: true, description: 'Core ML algorithms, techniques, and foundations' },
        { id: 'deep_learning', name: 'Deep Learning', category: 'research', selected: true, description: 'Neural networks, deep learning research and applications' },
        { id: 'nlp_llm', name: 'Natural Language Processing', category: 'language', selected: true, description: 'Language models, NLP, and conversational AI' },
        { id: 'computer_vision', name: 'Computer Vision', category: 'research', selected: false, description: 'Image recognition, visual AI, and computer vision' },
        { id: 'ai_tools', name: 'AI Tools & Platforms', category: 'platform', selected: false, description: 'New AI tools and platforms for developers' },
        { id: 'ai_research', name: 'AI Research Papers', category: 'research', selected: false, description: 'Latest academic research and scientific breakthroughs' },
        { id: 'ai_ethics', name: 'AI Ethics & Safety', category: 'policy', selected: false, description: 'Responsible AI, safety research, and ethical considerations' },
        { id: 'robotics', name: 'Robotics & Automation', category: 'robotics', selected: false, description: 'Physical AI, robotics, and automation systems' },
        { id: 'ai_business', name: 'AI in Business', category: 'company', selected: false, description: 'Enterprise AI and industry applications' },
        { id: 'ai_startups', name: 'AI Startups & Funding', category: 'startup', selected: false, description: 'New AI companies and startup ecosystem' },
        { id: 'ai_healthcare', name: 'AI in Healthcare', category: 'healthcare', selected: false, description: 'Medical AI applications and healthcare tech' },
        { id: 'ai_finance', name: 'AI in Finance', category: 'finance', selected: false, description: 'Financial AI, trading, and fintech applications' }
      ]);
    }
  };

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleContentTypeToggle = (contentType: ContentType) => {
    setSelectedContentTypes(prev => 
      prev.includes(contentType) 
        ? prev.filter(type => type !== contentType)
        : [...prev, contentType]
    );
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const preferences = {
        topics: availableTopics.filter(topic => 
          selectedTopics.includes(topic.id)
        ).map(topic => ({
          ...topic,
          selected: true
        })),
        user_roles: [selectedRole], // Convert single role to array for backend
        content_types: selectedContentTypes,
        newsletter_frequency: newsletterFrequency,
        email_notifications: emailNotifications,
        breaking_news_alerts: breakingNewsAlerts,
        experience_level: selectedExperience,
        role_type: selectedRole,
        onboarding_completed: true // Use snake_case to match backend
      };

      await updatePreferences(preferences);
      localStorage.setItem('onboardingComplete', 'true');
      onComplete();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedExperience && selectedRole;
      case 2:
        return selectedTopics.length > 0;
      case 3:
        return selectedContentTypes.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStep1 = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <User className="step-icon" size={32} />
        <h2>Tell us about yourself</h2>
        <p>Help us personalize your AI news experience</p>
      </div>

      <div className="preference-section">
        <h3>What's your AI experience level?</h3>
        <div className="options-grid">
          {EXPERIENCE_LEVELS.map(level => (
            <button
              key={level.id}
              className={`option-card ${selectedExperience === level.id ? 'selected' : ''}`}
              onClick={() => setSelectedExperience(level.id)}
            >
              <span className="option-icon">{level.icon}</span>
              <div className="option-content">
                <h4>{level.name}</h4>
                <p>{level.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="preference-section">
        <h3>What's your professional role?</h3>
        <div className="options-grid">
          {ROLE_TYPES.map(role => (
            <button
              key={role.id}
              className={`option-card ${selectedRole === role.id ? 'selected' : ''}`}
              onClick={() => setSelectedRole(role.id)}
            >
              <span className="option-icon">{role.icon}</span>
              <div className="option-content">
                <h4>{role.name}</h4>
                <p>{role.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <Brain className="step-icon" size={32} />
        <h2>Choose your AI interests</h2>
        <p>Select topics you'd like to follow (you can change these later)</p>
      </div>

      <div className="content-types-grid">
        {availableTopics.map(topic => {
          const IconComponent = CATEGORY_ICONS[topic.category as keyof typeof CATEGORY_ICONS] || Brain;
          return (
            <button
              key={topic.id}
              className={`content-type-card ${selectedTopics.includes(topic.id) ? 'selected' : ''}`}
              onClick={() => handleTopicToggle(topic.id)}
            >
              <IconComponent className="content-type-icon" size={24} />
              <div className="content-type-info">
                <h4>{topic.name}</h4>
                <p>{topic.description}</p>
              </div>
              {selectedTopics.includes(topic.id) && (
                <Check className="content-type-check" size={16} />
              )}
            </button>
          );
        })}
      </div>

      <div className="step-footer">
        <p>{selectedTopics.length} topics selected</p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <BookOpen className="step-icon" size={32} />
        <h2>Content preferences</h2>
        <p>Choose how you like to consume AI content</p>
      </div>

      <div className="preference-section">
        <h3>Content types you enjoy</h3>
        <div className="content-types-grid">
          {CONTENT_TYPES.map(contentType => (
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
                <Check className="content-type-check" size={16} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="preference-section">
        <h3>How often would you like newsletter updates?</h3>
        <div className="frequency-options">
          {NEWSLETTER_FREQUENCIES.map(freq => (
            <button
              key={freq.id}
              className={`frequency-card ${newsletterFrequency === freq.id ? 'selected' : ''}`}
              onClick={() => setNewsletterFrequency(freq.id as 'daily' | 'weekly' | 'monthly')}
            >
              <span className="frequency-icon">{freq.icon}</span>
              <div className="frequency-info">
                <h4>{freq.name}</h4>
                <p>{freq.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <Bell className="step-icon" size={32} />
        <h2>Notification preferences</h2>
        <p>Stay informed with personalized alerts</p>
      </div>

      <div className="notification-options">
        <div className="notification-item">
          <div className="notification-info">
            <Mail className="notification-icon" size={20} />
            <div>
              <h4>Email Notifications</h4>
              <p>Receive curated AI news in your inbox</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="notification-item">
          <div className="notification-info">
            <TrendingUp className="notification-icon" size={20} />
            <div>
              <h4>Breaking News Alerts</h4>
              <p>Get notified about major AI breakthroughs immediately</p>
            </div>
          </div>
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
  );

  return (
    <div className="comprehensive-onboarding">
      <div className="onboarding-container">
        {/* Progress Bar */}
        <div className="progress-bar">
          <div className="progress-steps">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`progress-step ${i + 1 <= currentStep ? 'active' : ''} ${i + 1 < currentStep ? 'completed' : ''}`}
              >
                {i + 1 < currentStep ? <Check size={16} /> : i + 1}
              </div>
            ))}
          </div>
          <div className="progress-fill" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
        </div>

        {/* Step Content */}
        <div className="step-content">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* Navigation */}
        <div className="onboarding-actions">
          <div className="action-left">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="btn btn-ghost"
                disabled={loading}
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
          </div>

          <div className="action-center">
            <span className="step-indicator">
              Step {currentStep} of {totalSteps}
            </span>
          </div>

          <div className="action-right">
            <button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="btn btn-primary"
            >
              {loading ? (
                'Saving...'
              ) : currentStep === totalSteps ? (
                'Complete Setup'
              ) : (
                <>
                  Next
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveOnboarding;