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



const EXPERIENCE_LEVELS = [
  { id: 'beginner', name: 'Beginner', description: 'New to AI, want to learn basics', icon: '🌱' },
  { id: 'intermediate', name: 'Intermediate', description: 'Some AI knowledge, want to stay updated', icon: '🚀' },
  { id: 'advanced', name: 'Advanced', description: 'AI professional, need cutting-edge insights', icon: '⚡' },
  { id: 'expert', name: 'Expert', description: 'AI researcher/leader, need comprehensive coverage', icon: '🎯' }
];

const ROLE_TYPES = [
  { id: 'student', name: 'Student', description: 'Learning AI/ML concepts and applications', icon: '🎓' },
  { id: 'developer', name: 'Developer', description: 'Software developer interested in AI tools', icon: '💻' },
  { id: 'researcher', name: 'Researcher', description: 'Academic or industry researcher', icon: '🔬' },
  { id: 'enthusiast', name: 'Enthusiast', description: 'Passionate about AI developments', icon: '❤️' },
  { id: 'executive', name: 'Executive', description: 'Business leader exploring AI opportunities', icon: '👔' },
  { id: 'entrepreneur', name: 'Entrepreneur', description: 'Building AI-powered products or services', icon: '🚀' }
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
  const [availableContentTypes, setAvailableContentTypes] = useState<any[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>([]);

  const { updatePreferences } = useAuth();

  const totalSteps = 2;

  useEffect(() => {
    loadAvailableTopicsAndContentTypes();
  }, []);

  const loadAvailableTopicsAndContentTypes = async () => {
    try {
      // Get both categories and content types from the backend
      const response = await authService.getUserRolesAndTopics();
      
      // Set topics with auto-selection for Generative AI, AI Start Ups, AI Applications
      const topics = response.topics || [];
      setAvailableTopics(topics);
      
      const autoSelectedTopics = topics.filter(t => 
        ['Generative AI', 'AI Start Ups', 'AI Applications'].includes(t.name)
      ).map(t => t.id);
      setSelectedTopics(autoSelectedTopics);
      
      // Set content types from backend and auto-select all 3
      const contentTypes = response.content_types || [];
      setAvailableContentTypes(contentTypes);
      
      const autoSelectedContentTypes = contentTypes.filter(ct => ct.selected).map(ct => ct.name.toLowerCase());
      setSelectedContentTypes(autoSelectedContentTypes);
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
        content_types: availableContentTypes.filter(ct => ct.selected).map(ct => ct.name),
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
        return selectedTopics.length >= 1; // At least 1 topic must be selected (they're auto-selected)
      case 3:
        return availableContentTypes.length > 0; // Content types are auto-selected from backend
      case 4:
        return true; // Publisher preferences are pre-selected
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

      <div className="preference-section">
        <h3>Select your interests (3 are pre-selected)</h3>
        <div className="topics-grid">
          {availableTopics.map(topic => {
            const IconComponent = CATEGORY_ICONS[topic.category as keyof typeof CATEGORY_ICONS] || Brain;
            return (
              <button
                key={topic.id}
                className={`topic-card ${selectedTopics.includes(topic.id) ? 'selected' : ''}`}
                onClick={() => handleTopicToggle(topic.id)}
              >
                <IconComponent className="topic-icon" size={20} />
                <div className="topic-content">
                  <h4>{topic.name}</h4>
                  <p>{topic.description}</p>
                </div>
                {selectedTopics.includes(topic.id) && (
                  <Check className="topic-check" size={16} />
                )}
              </button>
            );
          })}
        </div>
        <p className="topic-count">{selectedTopics.length} topics selected</p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="onboarding-step">
      <div className="step-header">
        <BookOpen className="step-icon" size={32} />
        <h2>Content & Publisher preferences</h2>
        <p>Choose how you consume AI content and your preferred sources</p>
      </div>

      <div className="preference-section">
        <h3>Content types (all pre-selected)</h3>
        <div className="content-types-grid">
          {availableContentTypes.map(contentType => (
            <button
              key={contentType.id}
              className={`content-type-card ${contentType.selected ? 'selected' : ''}`}
            >
              <span className="content-type-icon">{contentType.icon || '📄'}</span>
              <div className="content-type-info">
                <h4>{contentType.display_name}</h4>
                <p>{contentType.description}</p>
              </div>
              {contentType.selected && (
                <Check className="content-type-check" size={16} />
              )}
            </button>
          ))}
        </div>
        <p className="content-note">All content types are pre-selected for comprehensive coverage</p>
      </div>

      <div className="preference-section">
        <h3>Trusted AI news sources (all pre-selected)</h3>
        <div className="publishers-grid">
          {[
            { id: 'techcrunch', name: 'TechCrunch', description: 'Leading tech news and startup coverage', icon: '🚀' },
            { id: 'arxiv', name: 'arXiv', description: 'Research papers and academic publications', icon: '📄' },
            { id: 'venturebeat', name: 'VentureBeat', description: 'Technology and business news', icon: '💼' },
            { id: 'airesearch', name: 'AI Research', description: 'Latest AI research and developments', icon: '🔬' },
            { id: 'techreport', name: 'The Register', description: 'Technology industry analysis', icon: '📊' },
            { id: 'awsblog', name: 'AWS Blog', description: 'Cloud computing and AI services', icon: '☁️' }
          ].map(publisher => (
            <button
              key={publisher.id}
              className="publisher-card selected"
            >
              <span className="publisher-icon">{publisher.icon}</span>
              <div className="publisher-info">
                <h4>{publisher.name}</h4>
                <p>{publisher.description}</p>
              </div>
              <Check className="publisher-check" size={16} />
            </button>
          ))}
        </div>
        <p className="publisher-note">All sources are pre-selected for comprehensive AI coverage</p>
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