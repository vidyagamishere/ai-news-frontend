import React, { useState } from 'react';
import { Bell, Mail, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

const Preferences: React.FC = () => {
  const { user, updatePreferences } = useAuth();
  const [saving, setSaving] = useState(false);
  
  const [preferences, setPreferences] = useState({
    email_notifications: user?.preferences?.email_notifications ?? true,
    breaking_news_alerts: user?.preferences?.breaking_news_alerts ?? false,
    newsletter_frequency: user?.preferences?.newsletter_frequency ?? 'weekly',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences({
        ...user?.preferences,
        ...preferences
      });
      alert('✅ Preferences updated successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('❌ Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 pt-20 pb-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Preferences
            </h1>
            <p className="text-gray-600">Customize your AI News experience</p>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-50">
                  <Mail size={24} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Email Notifications</h3>
                  <p className="text-sm text-gray-600 mb-3">Receive updates about new AI news</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.email_notifications}
                      onChange={(e) => setPreferences({ ...preferences, email_notifications: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Enable email notifications</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-orange-50">
                  <Zap size={24} className="text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Breaking News Alerts</h3>
                  <p className="text-sm text-gray-600 mb-3">Get notified about important AI developments</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.breaking_news_alerts}
                      onChange={(e) => setPreferences({ ...preferences, breaking_news_alerts: e.target.checked })}
                      className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Enable breaking news alerts</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-purple-50">
                  <Bell size={24} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Newsletter Frequency</h3>
                  <p className="text-sm text-gray-600 mb-3">How often would you like to receive newsletters?</p>
                  <select
                    value={preferences.newsletter_frequency}
                    onChange={(e) => setPreferences({ ...preferences, newsletter_frequency: e.target.value as '12_hours' | 'daily' | 'weekly' | 'monthly' })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 sticky bottom-0 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Preferences;
