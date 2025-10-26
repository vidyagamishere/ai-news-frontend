import React, { useState } from 'react';
import { X } from 'lucide-react';

const EXPERIENCE_LEVELS = [
  { id: 'beginner', name: 'Beginner', description: 'New to AI, want to learn basics' },
  { id: 'intermediate', name: 'Intermediate', description: 'Some AI knowledge, want to stay updated' },
  { id: 'advanced', name: 'Advanced', description: 'AI professional, need cutting-edge insights' },
  { id: 'expert', name: 'Expert', description: 'AI researcher/leader, need comprehensive coverage' }
];

const ROLE_TYPES = [
  { id: 'student', name: 'Student', description: 'Learning AI/ML concepts and applications' },
  { id: 'developer', name: 'Developer', description: 'Software developer interested in AI tools' },
  { id: 'researcher', name: 'Researcher', description: 'Academic or industry researcher' },
  { id: 'enthusiast', name: 'Enthusiast', description: 'Passionate about AI developments' },
  { id: 'executive', name: 'Executive', description: 'Business leader exploring AI opportunities' },
  { id: 'entrepreneur', name: 'Entrepreneur', description: 'Building AI-powered products or services' }
];

interface SettingsFullScreenProps {
  userPreferences: {
    experience_level: string;
    professional_roles: string[];
    categories_selected: number[];
    content_types_selected: number[];
    publishers_selected: number[];
  };
  setUserPreferences: React.Dispatch<React.SetStateAction<any>>;
  availableCategories: any[];
  availableContentTypes: any[];
  availablePublishers: any[];
  onClose: () => void;
  onSave: () => void;
  savingSettings: boolean;
  setSettingsChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

const SettingsFullScreen: React.FC<SettingsFullScreenProps> = ({
  userPreferences,
  setUserPreferences,
  availableCategories,
  availableContentTypes,
  availablePublishers,
  onClose,
  onSave,
  savingSettings,
  setSettingsChanged
}) => {
  const [settingsStep, setSettingsStep] = useState(1);
  const totalSteps = 2;
  const progressPercentage = (settingsStep / totalSteps) * 100;

  const canProceedStep1 = userPreferences.experience_level && 
                         userPreferences.professional_roles.length > 0 && 
                         userPreferences.categories_selected.length >= 1;
  
  const canProceedStep2 = userPreferences.content_types_selected.length >= 1 && 
                         userPreferences.publishers_selected.length >= 3;

  // Toggle handlers
  const handleCategoryToggle = (categoryId: number) => {
    const newCategories = userPreferences.categories_selected.includes(categoryId)
      ? userPreferences.categories_selected.filter((id: number) => id !== categoryId)
      : [...userPreferences.categories_selected, categoryId];
    
    setUserPreferences({
      ...userPreferences,
      categories_selected: newCategories
    });
    setSettingsChanged(true);
  };

  const handleContentTypeToggle = (contentTypeId: number) => {
    const newContentTypes = userPreferences.content_types_selected.includes(contentTypeId)
      ? userPreferences.content_types_selected.filter((id: number) => id !== contentTypeId)
      : [...userPreferences.content_types_selected, contentTypeId];
    
    setUserPreferences({
      ...userPreferences,
      content_types_selected: newContentTypes
    });
    setSettingsChanged(true);
  };

  const handlePublisherToggle = (publisherId: number) => {
    const newPublishers = userPreferences.publishers_selected.includes(publisherId)
      ? userPreferences.publishers_selected.filter((id: number) => id !== publisherId)
      : [...userPreferences.publishers_selected, publisherId];
    
    setUserPreferences({
      ...userPreferences,
      publishers_selected: newPublishers
    });
    setSettingsChanged(true);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#ffffff',
      zIndex: 100,
      overflow: 'auto'
    }}>
      {/* Settings Header - Minimalistic */}
      <div style={{
        position: 'sticky',
        top: 0,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        zIndex: 10
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>
              Settings & Preferences
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
              Step {settingsStep} of {totalSteps}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              color: '#6b7280',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.color = '#111827';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div style={{ maxWidth: '900px', margin: '16px auto 0', height: '4px', backgroundColor: '#f3f4f6', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            width: `${progressPercentage}%`, 
            backgroundColor: '#111827',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Settings Content - Minimalistic White Background */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        {settingsStep === 1 && (
          <div>
            {/* Experience Level */}
            <div style={{ marginBottom: '48px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                AI Experience Level
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {EXPERIENCE_LEVELS.map(level => (
                  <button
                    key={level.id}
                    onClick={() => {
                      setUserPreferences((prev: any) => ({ ...prev, experience_level: level.id }));
                      setSettingsChanged(true);
                    }}
                    style={{
                      padding: '16px',
                      border: userPreferences.experience_level === level.id ? '2px solid #111827' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (userPreferences.experience_level !== level.id) {
                        e.currentTarget.style.borderColor = '#9ca3af';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (userPreferences.experience_level !== level.id) {
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {ROLE_TYPES.map(role => (
                  <button
                    key={role.id}
                    onClick={() => {
                      setUserPreferences((prev: any) => ({
                        ...prev,
                        professional_roles: prev.professional_roles.includes(role.id)
                          ? prev.professional_roles.filter((r: any) => r !== role.id)
                          : [...prev.professional_roles, role.id]
                      }));
                      setSettingsChanged(true);
                    }}
                    style={{
                      padding: '16px',
                      border: userPreferences.professional_roles.includes(role.id) ? '2px solid #111827' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!userPreferences.professional_roles.includes(role.id)) {
                        e.currentTarget.style.borderColor = '#9ca3af';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!userPreferences.professional_roles.includes(role.id)) {
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
                {userPreferences.categories_selected.length} categories selected
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                {availableCategories.map(category => (
                  <label
                    key={category.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      border: userPreferences.categories_selected.includes(category.id) ? '2px solid #111827' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: '#ffffff'
                    }}
                    onMouseEnter={(e) => {
                      if (!userPreferences.categories_selected.includes(category.id)) {
                        e.currentTarget.style.borderColor = '#9ca3af';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!userPreferences.categories_selected.includes(category.id)) {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={userPreferences.categories_selected.includes(category.id)}
                      onChange={(e) => {
                        setUserPreferences((prev: any) => ({
                          ...prev,
                          categories_selected: e.target.checked
                            ? [...prev.categories_selected, category.id]
                            : prev.categories_selected.filter((id: any) => id !== category.id)
                        }));
                        setSettingsChanged(true);
                      }}
                      style={{ width: '18px', height: '18px', accentColor: '#111827', cursor: 'pointer' }}
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
        )}

        {settingsStep === 2 && (
          <div>
            {/* Content Types */}
            <div style={{ marginBottom: '48px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                Content Types
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px' }}>
                {availableContentTypes.map((type) => (
                  <div
                    key={type.id}
                    onClick={() => handleContentTypeToggle(type.id)}
                    style={{
                      padding: '20px',
                      border: `2px solid ${userPreferences.content_types_selected.includes(type.id) ? '#3b82f6' : '#e5e7eb'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      backgroundColor: userPreferences.content_types_selected.includes(type.id) ? '#eff6ff' : '#ffffff',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    {userPreferences.content_types_selected.includes(type.id) && (
                      <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                        <svg style={{ width: '24px', height: '24px', color: '#3b82f6' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{type.name}</h3>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>{type.display_name || type.description || 'No description available'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Publishers */}
            <div style={{ marginBottom: '48px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                Preferred Publishers
              </h3>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
                {userPreferences.publishers_selected.length} publishers selected (minimum 3)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', maxHeight: '400px', overflowY: 'auto', padding: '4px' }}>
                {availablePublishers.map(publisher => (
                  <label
                    key={publisher.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      border: userPreferences.publishers_selected.includes(publisher.id) ? '2px solid #111827' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: '#ffffff'
                    }}
                    onMouseEnter={(e) => {
                      if (!userPreferences.publishers_selected.includes(publisher.id)) {
                        e.currentTarget.style.borderColor = '#9ca3af';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!userPreferences.publishers_selected.includes(publisher.id)) {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={userPreferences.publishers_selected.includes(publisher.id)}
                      onChange={(e) => {
                        const publisherId = publisher.id as number;
                        setUserPreferences((prev: any) => ({
                          ...prev,
                          publishers_selected: e.target.checked
                            ? [...prev.publishers_selected, publisherId]
                            : prev.publishers_selected.filter((id: number) => id !== publisherId)
                        }));
                        setSettingsChanged(true);
                      }}
                      style={{ width: '18px', height: '18px', accentColor: '#111827', cursor: 'pointer' }}
                    />
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                      {publisher.name}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Footer - Action Buttons */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        padding: '16px 24px'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => {
              if (settingsStep > 1) {
                setSettingsStep(settingsStep - 1);
              } else {
                onClose();
              }
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              color: '#111827',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            {settingsStep > 1 ? 'Back' : 'Cancel'}
          </button>
          
          {settingsStep < totalSteps ? (
            <button
              onClick={() => setSettingsStep(settingsStep + 1)}
              disabled={settingsStep === 1 ? !canProceedStep1 : false}
              style={{
                padding: '10px 24px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                backgroundColor: (settingsStep === 1 && !canProceedStep1) ? '#e5e7eb' : '#f3f4f6',
                color: (settingsStep === 1 && !canProceedStep1) ? '#9ca3af' : '#1f2937',
                fontSize: '14px',
                fontWeight: '600',
                cursor: (settingsStep === 1 && !canProceedStep1) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (settingsStep === 1 && canProceedStep1) {
                  e.currentTarget.style.backgroundColor = '#dbeafe';
                  e.currentTarget.style.color = '#1f2937';
                }
              }}
              onMouseLeave={(e) => {
                if (settingsStep === 1 && canProceedStep1) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.color = '#1f2937';
                }
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={onSave}
              disabled={!canProceedStep2 || savingSettings}
              style={{
                padding: '10px 24px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                backgroundColor: (!canProceedStep2 || savingSettings) ? '#e5e7eb' : '#f3f4f6',
                color: (!canProceedStep2 || savingSettings) ? '#9ca3af' : '#1f2937',
                fontSize: '14px',
                fontWeight: '600',
                cursor: (!canProceedStep2 || savingSettings) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (canProceedStep2 && !savingSettings) {
                  e.currentTarget.style.backgroundColor = '#dbeafe';
                  e.currentTarget.style.color = '#1f2937';
                }
              }}
              onMouseLeave={(e) => {
                if (canProceedStep2 && !savingSettings) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.color = '#1f2937';
                }
              }}
            >
              {savingSettings ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsFullScreen;
