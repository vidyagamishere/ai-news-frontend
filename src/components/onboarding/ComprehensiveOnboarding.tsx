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
        newsletter_frequency: "weekly" as "weekly" | "12_hours" | "daily" | "monthly",
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
    <div>
      {/* Experience Level */}
      <div style={{ marginBottom: '48px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
          AI Experience Level
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          {EXPERIENCE_LEVELS.map(level => (
            <button
              key={level.id}
              onClick={() => setSelectedExperience(level.id)}
              style={{
                padding: '16px',
                border: selectedExperience === level.id ? '2px solid #111827' : '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (selectedExperience !== level.id) {
                  e.currentTarget.style.borderColor = '#9ca3af';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedExperience !== level.id) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                {level.name}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {level.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Professional Role */}
      <div style={{ marginBottom: '48px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
          Professional Role
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          {ROLE_TYPES.map(role => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              style={{
                padding: '16px',
                border: selectedRole === role.id ? '2px solid #111827' : '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (selectedRole !== role.id) {
                  e.currentTarget.style.borderColor = '#9ca3af';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedRole !== role.id) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                {role.name}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {role.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div style={{ marginBottom: '48px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
          Interested Categories
        </h3>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
          {selectedCategoryIds.length} categories selected (3 pre-selected)
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '12px'
        }}>
          {availableCategories.map(category => (
            <label
              key={category.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                border: selectedCategoryIds.includes(category.id) ? '2px solid #111827' : '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: '#ffffff'
              }}
              onMouseEnter={(e) => {
                if (!selectedCategoryIds.includes(category.id)) {
                  e.currentTarget.style.borderColor = '#9ca3af';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedCategoryIds.includes(category.id)) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }
              }}
            >
              <input
                type="checkbox"
                checked={selectedCategoryIds.includes(category.id)}
                onChange={() => handleCategoryToggle(category.id)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#111827',
                  cursor: 'pointer'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  {category.name}
                </div>
                {category.description && (
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                    {category.description}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      {/* Content Types */}
      <div style={{ marginBottom: '48px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
          Content Types
        </h3>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
          {selectedContentTypeIds.length} content types selected (minimum 1)
        </p>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '500px'
        }}>
          {availableContentTypes.map(type => (
            <div
              key={type.id}
              onClick={() => handleContentTypeToggle(type.id)}
              style={{
                padding: '20px',
                border: `2px solid ${selectedContentTypeIds.includes(type.id) ? '#3b82f6' : '#e5e7eb'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                backgroundColor: selectedContentTypeIds.includes(type.id) ? '#eff6ff' : '#ffffff',
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              {selectedContentTypeIds.includes(type.id) && (
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <svg style={{ width: '24px', height: '24px', color: '#3b82f6' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                {type.name}
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                {type.display_name || type.description || 'No description available'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Publishers */}
      <div style={{ marginBottom: '48px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
          Trusted AI News Sources
        </h3>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
          {selectedPublisherIds.length} publishers selected (minimum 3)
        </p>
        
        {(() => {
          const { grouped, uncategorized } = groupPublishersByCategory();
          const sortedCategoryNames = Object.keys(grouped).sort();
          
          return (
            <>
              {sortedCategoryNames.map(categoryName => {
                const publishers = grouped[categoryName];
                const selectedInCategory = publishers.filter(pub => selectedPublisherIds.includes(pub.id)).length;
                
                return (
                  <div key={categoryName} style={{ marginBottom: '32px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>📚</span>
                        {categoryName}
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '500',
                          color: '#6b7280',
                          backgroundColor: '#f3f4f6',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          {selectedInCategory}/{publishers.length}
                        </span>
                      </h4>
                      
                      <button
                        onClick={() => {
                          const allCategoryPublisherIds = publishers.map(p => p.id);
                          const allSelected = allCategoryPublisherIds.every(id => selectedPublisherIds.includes(id));
                          
                          if (allSelected) {
                            setSelectedPublisherIds(prev => prev.filter(id => !allCategoryPublisherIds.includes(id)));
                          } else {
                            setSelectedPublisherIds(prev => [...new Set([...prev, ...allCategoryPublisherIds])]);
                          }
                        }}
                        style={{
                          fontSize: '11px',
                          padding: '4px 12px',
                          backgroundColor: selectedInCategory === publishers.length ? '#fee2e2' : '#dbeafe',
                          color: selectedInCategory === publishers.length ? '#dc2626' : '#1e40af',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                      >
                        {selectedInCategory === publishers.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '12px'
                    }}>
                      {publishers.map(publisher => (
                        <label
                          key={publisher.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            border: selectedPublisherIds.includes(publisher.id) ? '2px solid #111827' : '1px solid #e5e7eb',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            backgroundColor: '#ffffff'
                          }}
                          onMouseEnter={(e) => {
                            if (!selectedPublisherIds.includes(publisher.id)) {
                              e.currentTarget.style.borderColor = '#9ca3af';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!selectedPublisherIds.includes(publisher.id)) {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPublisherIds.includes(publisher.id)}
                            onChange={() => handlePublisherToggle(publisher.id)}
                            style={{
                              width: '18px',
                              height: '18px',
                              accentColor: '#111827',
                              cursor: 'pointer'
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                              {publisher.name}
                            </div>
                            {publisher.description && (
                              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                                {publisher.description}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {uncategorized.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>📰</span>
                    General AI News Sources
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '12px'
                  }}>
                    {uncategorized.map(publisher => (
                      <label
                        key={publisher.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          border: selectedPublisherIds.includes(publisher.id) ? '2px solid #111827' : '1px solid #e5e7eb',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          backgroundColor: '#ffffff'
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedPublisherIds.includes(publisher.id)) {
                            e.currentTarget.style.borderColor = '#9ca3af';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedPublisherIds.includes(publisher.id)) {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPublisherIds.includes(publisher.id)}
                          onChange={() => handlePublisherToggle(publisher.id)}
                          style={{
                            width: '18px',
                            height: '18px',
                            accentColor: '#111827',
                            cursor: 'pointer'
                          }}
                        />
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                          {publisher.name}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );


  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#ffffff',
      zIndex: 1000,
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>
            Welcome to Vidyagam
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{
          maxWidth: '900px',
          margin: '16px auto 0',
          height: '4px',
          backgroundColor: '#f3f4f6',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${(currentStep / totalSteps) * 100}%`,
            backgroundColor: '#111827',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
      </div>

      {/* Footer Actions */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        padding: '16px 24px'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              backgroundColor: currentStep === 1 ? '#f9fafb' : '#ffffff',
              color: currentStep === 1 ? '#9ca3af' : '#111827',
              fontSize: '14px',
              fontWeight: '500',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (currentStep > 1) {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (currentStep > 1) {
                e.currentTarget.style.backgroundColor = '#ffffff';
              }
            }}
          >
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed() || loading}
            style={{
              padding: '10px 24px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              backgroundColor: !canProceed() || loading ? '#e5e7eb' : '#f3f4f6',
              color: !canProceed() || loading ? '#9ca3af' : '#1f2937',
              fontSize: '14px',
              fontWeight: '600',
              cursor: !canProceed() || loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (canProceed() && !loading) {
                e.currentTarget.style.backgroundColor = '#dbeafe';
              }
            }}
            onMouseLeave={(e) => {
              if (canProceed() && !loading) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }
            }}
          >
            {loading ? 'Saving...' : currentStep === totalSteps ? 'Complete Setup' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveOnboarding;