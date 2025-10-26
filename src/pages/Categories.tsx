import React, { useState, useEffect } from 'react';
import { Check, Brain, Cpu, Factory, Shield, Wrench } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import Header from '../components/Header';

const CATEGORY_ICONS = {
  research: Brain,
  language: Cpu,
  platform: Wrench,
  policy: Shield,
  robotics: Factory,
  company: Factory,
  startup: Factory,
  hardware: Cpu,
};

const Categories: React.FC = () => {
  const { user, updatePreferences } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await apiService.getAvailableCategories();
      setCategories(response.categories || []);
      
      if (user?.preferences?.category_ids_selected) {
        setSelectedCategoryIds(user.preferences.category_ids_selected);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCategory = (categoryId: number) => {
    setSelectedCategoryIds(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const selectedCategoryNames = categories
        .filter(cat => selectedCategoryIds.includes(cat.id))
        .map(cat => cat.name);

      await updatePreferences({
        ...user?.preferences,
        category_ids_selected: selectedCategoryIds,
        categories_selected: selectedCategoryNames
      });
      
      alert('✅ Categories updated successfully!');
    } catch (error) {
      console.error('Error saving categories:', error);
      alert('❌ Failed to save categories');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              My Categories
            </h1>
            <p className="text-gray-600">Select the AI topics you're interested in</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {categories.map(category => {
                  const IconComponent = CATEGORY_ICONS[category.category as keyof typeof CATEGORY_ICONS] || Brain;
                  const isSelected = selectedCategoryIds.includes(category.id);
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleToggleCategory(category.id)}
                      className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                        isSelected
                          ? 'border-purple-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg transform scale-105'
                          : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-purple-100' : 'bg-gray-100'}`}>
                          <IconComponent size={24} className={isSelected ? 'text-purple-600' : 'text-gray-600'} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                          <p className="text-sm text-gray-600">{category.description}</p>
                        </div>
                        {isSelected && (
                          <Check size={24} className="text-purple-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="sticky bottom-0 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedCategoryIds.length} categories selected
                  </span>
                  <button
                    onClick={handleSave}
                    disabled={saving || selectedCategoryIds.length === 0}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Categories;
