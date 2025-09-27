import React, { useState, useEffect } from 'react';
import { Check, Brain, Cpu, Factory, Shield, Wrench } from 'lucide-react';
import type { AITopic, ContentType } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import './onboarding.css';

const CATEGORY_ICONS = {
  // ai_sources_config.py categories
  company: Factory,
  research: Brain,
  news: Cpu,
  platform: Wrench,
  startup: Factory,
  international: Shield,
  robotics: Cpu,
  automotive: Cpu,
  creative: Brain,
  policy: Shield,
  language: Brain,
  gaming: Cpu,
  healthcare: Shield,
  finance: Factory,
  hardware: Wrench,
  cloud: Wrench,
  events: Brain,
  learning: Brain,
  // Legacy fallback categories
  technology: Cpu,
  industry: Factory,
  ethics: Shield,
  tools: Wrench
};

const CONTENT_TYPES: { id: ContentType; name: string; description: string }[] = [
  { id: 'blogs', name: 'Articles', description: 'In-depth analysis and news' },
  { id: 'podcasts', name: 'Podcasts', description: 'Audio content and interviews' },
  { id: 'videos', name: 'Videos', description: 'Visual content and tutorials' },
  { id: 'events', name: 'Events', description: 'Conferences and webinars' },
  { id: 'learning', name: 'Learning', description: 'Courses and educational resources' },
  { id: 'demos', name: 'Demos', description: 'Interactive demonstrations and showcases' }
];

interface TopicSelectorProps {
  onComplete: () => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ onComplete }) => {
  const [availableTopics, setAvailableTopics] = useState<AITopic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>(['blogs']);
  const [newsletterFrequency, setNewsletterFrequency] = useState<'daily' | 'weekly'>('weekly');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const { updatePreferences, user } = useAuth();

  useEffect(() => {
    loadAvailableTopics();
  }, []);

  const loadAvailableTopics = async () => {
    try {
      const topics = await authService.getAvailableTopics();
      
      // Ensure topics is an array
      if (!Array.isArray(topics)) {
        console.error('Topics API returned non-array:', topics);
        throw new Error('Invalid topics response');
      }
      
      setAvailableTopics(topics);
      
      // Pre-select some popular topics based on new naming
      const defaultTopics = topics.filter(t => 
        ['Machine Learning', 'AI Tools & Platforms', 'AI Ethics & Safety'].includes(t.name)
      ).map(t => t.id);
      setSelectedTopics(defaultTopics);
    } catch (error) {
      console.error('Failed to load topics from API:', error);
      // Fallback topics using ai_sources_config.py categories
      const fallbackTopics: AITopic[] = [
        { id: '1', name: 'Machine Learning', description: 'Latest ML research and applications', category: 'research', selected: true },
        { id: '2', name: 'AI Tools & Platforms', description: 'New AI tools and platforms for developers', category: 'platform', selected: true },
        { id: '3', name: 'AI Ethics & Safety', description: 'Responsible AI and ethical considerations', category: 'policy', selected: true },
        { id: '4', name: 'Computer Vision', description: 'Image recognition and visual AI', category: 'research', selected: false },
        { id: '5', name: 'Natural Language Processing', description: 'Language models and conversational AI', category: 'language', selected: false },
        { id: '6', name: 'AI in Healthcare', description: 'Medical AI applications and healthcare tech', category: 'healthcare', selected: false },
        { id: '7', name: 'AI Research Papers', description: 'Academic research and scientific breakthroughs', category: 'research', selected: false },
        { id: '8', name: 'AI in Automotive', description: 'Self-driving cars and automotive AI', category: 'automotive', selected: false },
        { id: '9', name: 'AI Startups', description: 'New AI companies and startup ecosystem', category: 'startup', selected: false },
        { id: '10', name: 'AI in Finance', description: 'Financial AI and fintech applications', category: 'finance', selected: false },
        { id: '11', name: 'Robotics & Automation', description: 'Physical AI and robotics systems', category: 'robotics', selected: false },
        { id: '12', name: 'AI News & Updates', description: 'Latest AI news and industry updates', category: 'news', selected: false }
      ];
      setAvailableTopics(fallbackTopics);
      setSelectedTopics(['1', '2', '3']);
    }
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const toggleContentType = (contentType: ContentType) => {
    setSelectedContentTypes(prev => 
      prev.includes(contentType)
        ? prev.filter(type => type !== contentType)
        : [...prev, contentType]
    );
  };

  const handleSavePreferences = async () => {
    if (selectedTopics.length === 0) {
      alert('Please select at least one topic');
      return;
    }

    setLoading(true);
    try {
      const updatedTopics = availableTopics.map(topic => ({
        ...topic,
        selected: selectedTopics.includes(topic.id)
      }));

      await updatePreferences({
        topics: updatedTopics,
        newsletter_frequency: newsletterFrequency,
        content_types: selectedContentTypes,
        email_notifications: true,
        onboardingCompleted: true
      });
      
      localStorage.setItem('onboardingComplete', 'true');
      onComplete();
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const groupedTopics = availableTopics.reduce((groups, topic) => {
    const category = topic.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(topic);
    return groups;
  }, {} as Record<string, AITopic[]>);

  if (step === 1) {
    return (
      <div className="topic-selector">
        <div className="topic-selector-header">
          <h2>Choose Your AI Interests</h2>
          <p>Select the topics you'd like to stay updated on. You can always change these later.</p>
          <div className="topic-progress">
            <span>{selectedTopics.length} topics selected</span>
          </div>
        </div>

        <div className="topic-categories">
          {Object.entries(groupedTopics).map(([category, topics]) => {
            const IconComponent = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || Brain;
            
            return (
              <div key={category} className="topic-category">
                <div className="category-header">
                  <IconComponent size={20} />
                  <h3>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                </div>
                
                <div className="topic-grid">
                  {topics.map(topic => (
                    <button
                      key={topic.id}
                      onClick={() => toggleTopic(topic.id)}
                      className={`topic-card ${selectedTopics.includes(topic.id) ? 'selected' : ''}`}
                    >
                      <div className="topic-card-content">
                        <h4>{topic.name}</h4>
                        <p>{topic.description}</p>
                      </div>
                      {selectedTopics.includes(topic.id) && (
                        <div className="topic-check">
                          <Check size={16} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="topic-selector-actions">
          <button onClick={() => setStep(2)} className="btn btn-primary">
            Next: Content Preferences
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="topic-selector">
      <div className="topic-selector-header">
        <button onClick={() => setStep(1)} className="back-btn">← Back</button>
        <h2>Content Preferences</h2>
        <p>Customize how you want to receive your AI news digest</p>
      </div>

      <div className="preference-section">
        <h3>Newsletter Frequency</h3>
        <div className="frequency-options">
          <label className={`frequency-option ${newsletterFrequency === 'daily' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="frequency"
              value="daily"
              checked={newsletterFrequency === 'daily'}
              onChange={() => setNewsletterFrequency('daily')}
            />
            <div className="frequency-content">
              <h4>Daily</h4>
              <p>Get the latest AI news every day</p>
              {user?.subscriptionTier === 'free' && (
                <span className="premium-badge">Premium Only</span>
              )}
            </div>
          </label>
          
          <label className={`frequency-option ${newsletterFrequency === 'weekly' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="frequency"
              value="weekly"
              checked={newsletterFrequency === 'weekly'}
              onChange={() => setNewsletterFrequency('weekly')}
            />
            <div className="frequency-content">
              <h4>Weekly</h4>
              <p>Weekly digest of the most important AI news</p>
            </div>
          </label>
        </div>
      </div>

      <div className="preference-section">
        <h3>Content Types</h3>
        <div className="content-types-grid">
          {CONTENT_TYPES.map(contentType => (
            <label
              key={contentType.id}
              className={`content-type-option ${selectedContentTypes.includes(contentType.id) ? 'selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedContentTypes.includes(contentType.id)}
                onChange={() => toggleContentType(contentType.id)}
              />
              <div className="content-type-content">
                <h4>{contentType.name}</h4>
                <p>{contentType.description}</p>
                {(contentType.id === 'events' || contentType.id === 'learning') && user?.subscriptionTier === 'free' && (
                  <span className="premium-badge">Premium</span>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="topic-selector-actions">
        <button
          onClick={handleSavePreferences}
          disabled={loading || selectedTopics.length === 0}
          className="btn btn-primary"
        >
          {loading ? 'Saving...' : 'Complete Setup'}
        </button>
      </div>
    </div>
  );
};

export default TopicSelector;