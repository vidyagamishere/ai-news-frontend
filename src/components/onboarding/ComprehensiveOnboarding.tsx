import React, { useState, useEffect } from 'react';
import { 
  Check, Brain, Cpu, Factory, Shield, Wrench, ArrowRight, ArrowLeft, 
  Mail, Bell, BookOpen, TrendingUp, Star, User
} from 'lucide-react';
import type { AITopic, ContentType } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import apiService from '../../services/api';
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
  const [selectedExperience, setSelectedExperience] = useState<string>('intermediate');
  const [selectedRole, setSelectedRole] = useState<string>('enthusiast');
  
  // Step 2: Categories/Topics of Interest
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  
  // Step 3: Content Preferences
  const [availableContentTypes, setAvailableContentTypes] = useState<any[]>([]);
  const [selectedContentTypeIds, setSelectedContentTypeIds] = useState<number[]>([]);
  
  // Step 4: Publisher Preferences (auto-selected based on categories)
  const [availablePublishers, setAvailablePublishers] = useState<any[]>([]);
  const [selectedPublisherIds, setSelectedPublisherIds] = useState<number[]>([]);
  
  // Filtered publishers based on selected categories
  const filteredPublishers = availablePublishers.filter(pub => 
    selectedCategoryIds.length === 0 || 
    !pub.category_id || 
    selectedCategoryIds.includes(pub.category_id)
  );
  
  // Group publishers by category
  const groupPublishersByCategory = () => {
    const grouped: { [key: string]: any[] } = {};
    const uncategorized: any[] = [];
    
    filteredPublishers.forEach(publisher => {
      if (publisher.category_id && selectedCategoryIds.includes(publisher.category_id)) {
        // Find category name
        const category = availableCategories.find(cat => cat.id === publisher.category_id);
        const categoryName = category?.name || `Category ${publisher.category_id}`;
        
        if (!grouped[categoryName]) {
          grouped[categoryName] = [];
        }
        grouped[categoryName].push(publisher);
      } else {
        // Publishers without category or with unselected categories
        uncategorized.push(publisher);
      }
    });
    
    return { grouped, uncategorized };
  };

  const { updatePreferences } = useAuth();

  const totalSteps = 2;

  useEffect(() => {
    loadAvailableTopicsAndContentTypes();
  }, []);

  // Update publisher selection when categories change
  useEffect(() => {
    if (availablePublishers.length > 0 && selectedCategoryIds.length > 0) {
      updatePublisherSelection(selectedCategoryIds);
    }
  }, [selectedCategoryIds, availablePublishers]);

  const loadAvailableTopicsAndContentTypes = async () => {
    try {
      // Load categories, content types, and publishers from API
      const [categoriesResponse, contentTypesResponse, publishersResponse] = await Promise.all([
        apiService.getAvailableCategories(),
        apiService.getAvailableContentTypes(), 
        apiService.getAvailablePublishers()
      ]);
      
      // Set categories with smart defaults
      const categories = categoriesResponse.categories || [];
      setAvailableCategories(categories);
      
      // Auto-select specific category IDs: 5 (Generative AI), 1 (Machine Learning), 2 (AI Applications)
      const preferredCategoryIds = [5, 1, 2];
      const existingCategoryIds = categories.map(cat => cat.id);
      const selectedCats = preferredCategoryIds.filter(id => existingCategoryIds.includes(id));
      
      // If preferred IDs don't exist, fall back to first available categories
      const finalSelectedCats = selectedCats.length > 0 ? selectedCats : categories.slice(0, 3).map(c => c.id);
      setSelectedCategoryIds(finalSelectedCats);
      
      // Set content types and auto-select all
      const contentTypes = contentTypesResponse.content_types || [];
      setAvailableContentTypes(contentTypes);
      setSelectedContentTypeIds(contentTypes.map(ct => ct.id)); // Select all content types
      
      // Set publishers for auto-selection
      const publishers = publishersResponse.publishers || [];
      setAvailablePublishers(publishers);
      
      console.log('📊 Onboarding data loaded:', {
        categories: categories.length,
        contentTypes: contentTypes.length,
        publishers: publishers.length,
        autoSelectedCategories: finalSelectedCats.length,
        selectedCategoryIds: finalSelectedCats
      });
      
      // Auto-select publishers from selected categories
      updatePublisherSelection(finalSelectedCats);
    } catch (error) {
      console.error('Error loading onboarding data:', error);
      // Set fallback data
      setAvailableCategories([]);
      setAvailableContentTypes([]);
      setAvailablePublishers([]);
    }
  };

  // Smart publisher selection based on selected categories
  const updatePublisherSelection = (categoryIds: number[]) => {
    const relevantPublishers = availablePublishers.filter(pub => 
      categoryIds.length === 0 || 
      !pub.category_id || 
      categoryIds.includes(pub.category_id)
    );
    
    // Auto-select all relevant publishers
    const autoSelectedIds = relevantPublishers.map(pub => pub.id);
    
    // Only update if there are relevant publishers
    if (autoSelectedIds.length > 0) {
      setSelectedPublisherIds(autoSelectedIds);
    }
    
    console.log('📰 Auto-selected publishers for categories:', { 
      categoryIds, 
      relevantPublishers: relevantPublishers.length,
      selectedIds: autoSelectedIds 
    });
  };

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategoryIds(prev => {
      const newSelection = prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];
      
      // Auto-update publisher selection when categories change
      updatePublisherSelection(newSelection);
      return newSelection;
    });
  };

  const handleContentTypeToggle = (contentTypeId: number) => {
    setSelectedContentTypeIds(prev => {
      const newSelection = prev.includes(contentTypeId) 
        ? prev.filter(id => id !== contentTypeId)
        : [...prev, contentTypeId];
      
      // Ensure at least 1 content type is selected
      return newSelection.length === 0 ? prev : newSelection;
    });
  };

  const handlePublisherToggle = (publisherId: number) => {
    setSelectedPublisherIds(prev => {
      const newSelection = prev.includes(publisherId) 
        ? prev.filter(id => id !== publisherId)
        : [...prev, publisherId];
      
      // Ensure we don't select publishers that aren't in filtered list
      const filteredIds = filteredPublishers.map(pub => pub.id);
      return newSelection.filter(id => filteredIds.includes(id));
    });
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
      // Get actual category names from selected categories
      const selectedCategoryNames = availableCategories
        .filter(category => selectedCategoryIds.includes(category.id))
        .map(category => category.name);

      // Get content type names from selected content types
      const selectedContentTypeNames = availableContentTypes
        .filter(contentType => selectedContentTypeIds.includes(contentType.id))
        .map(contentType => contentType.name);

      // Get publisher names from selected publishers
      const selectedPublisherNames = availablePublishers
        .filter(publisher => selectedPublisherIds.includes(publisher.id))
        .map(publisher => publisher.name);

      const preferences = {
        // Core user_preferences table fields
        experience_level: selectedExperience,
        professional_roles: [selectedRole],
        
        // Name-based arrays (backward compatibility)
        categories_selected: selectedCategoryNames,
        content_types_selected: selectedContentTypeNames,
        publishers_selected: selectedPublisherNames,
        
        // ID-based arrays (preferred for filtering)
        category_ids_selected: selectedCategoryIds,
        content_type_ids_selected: selectedContentTypeIds,
        publisher_ids_selected: selectedPublisherIds,
        
        // Additional preference fields
        newsletter_frequency: "weekly",
        email_notifications: true,
        breaking_news_alerts: false,
        onboarding_completed: true
      };

      console.log('🔍 Sending preferences:', JSON.stringify(preferences, null, 2));
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
        return selectedExperience && selectedRole && selectedCategoryIds.length >= 1;
      case 2:
        // Ensure we have at least 1 content type and at least 3 publishers from filtered list
        const validSelectedPublishers = selectedPublisherIds.filter(id => 
          filteredPublishers.some(pub => pub.id === id)
        );
        return selectedContentTypeIds.length >= 1 && validSelectedPublishers.length >= 3;
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
          {availableCategories.map(category => {
            const IconComponent = CATEGORY_ICONS[category.category as keyof typeof CATEGORY_ICONS] || Brain;
            return (
              <button
                key={category.id}
                className={`topic-card ${selectedCategoryIds.includes(category.id) ? 'selected' : ''}`}
                onClick={() => handleCategoryToggle(category.id)}
              >
                <IconComponent className="topic-icon" size={20} />
                <div className="topic-content">
                  <h4>{category.name}</h4>
                  <p>{category.description}</p>
                </div>
              </button>
            );
          })}
        </div>
        <p className="topic-count">{selectedCategoryIds.length} categories selected</p>
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
        <h3>Content types (at least 1 required)</h3>
        <div className="content-types-list">
          {availableContentTypes.map(contentType => (
            <label key={contentType.id} className="content-type-checkbox">
              <input
                type="checkbox"
                checked={selectedContentTypeIds.includes(contentType.id)}
                onChange={() => handleContentTypeToggle(contentType.id)}
                className="content-type-input"
              />
              <div className="content-type-content">
                <span className="content-type-icon">{contentType.icon || '📄'}</span>
                <div>
                  <h4>{contentType.display_name || contentType.name}</h4>
                  <p>{contentType.description}</p>
                </div>
              </div>
            </label>
          ))}
        </div>
        <p className="content-note">{selectedContentTypeIds.length} of {availableContentTypes.length} content types selected (minimum 1 required)</p>
      </div>

      <div className="preference-section">
        <h3>Trusted AI news sources (at least 3 required)</h3>
        {(() => {
          const { grouped, uncategorized } = groupPublishersByCategory();
          const validSelectedCount = selectedPublisherIds.filter(id => 
            filteredPublishers.some(pub => pub.id === id)
          ).length;
          
          return (
            <>
              {/* Display publishers grouped by selected categories */}
              {Object.entries(grouped).map(([categoryName, publishers]) => (
                <div key={categoryName} className="publisher-category-group">
                  <h4 className="category-group-title">📚 {categoryName}</h4>
                  <div className="publishers-list">
                    {publishers.map(publisher => (
                      <label key={publisher.id} className="publisher-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedPublisherIds.includes(publisher.id)}
                          onChange={() => handlePublisherToggle(publisher.id)}
                          className="publisher-input"
                        />
                        <div className="publisher-content">
                          <h4>{publisher.name}</h4>
                          <p>{publisher.description || 'AI news and insights'}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Display uncategorized publishers if any */}
              {uncategorized.length > 0 && (
                <div className="publisher-category-group">
                  <h4 className="category-group-title">📰 General AI News Sources</h4>
                  <div className="publishers-list">
                    {uncategorized.map(publisher => (
                      <label key={publisher.id} className="publisher-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedPublisherIds.includes(publisher.id)}
                          onChange={() => handlePublisherToggle(publisher.id)}
                          className="publisher-input"
                        />
                        <div className="publisher-content">
                          <h4>{publisher.name}</h4>
                          <p>{publisher.description || 'AI news and insights'}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="publisher-note">
                {validSelectedCount} of {filteredPublishers.length} sources selected 
                (minimum 3 required from your selected AI categories)
              </p>
            </>
          );
        })()}
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