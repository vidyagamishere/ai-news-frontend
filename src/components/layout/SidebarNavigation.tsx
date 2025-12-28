import React from 'react';
import '../../styles/sidebar-navigation.css';

interface ContentTypeTab {
  id: string;
  icon: string;
  label: string;
  count?: number;
}

interface SidebarNavigationProps {
  activeTab: string;
  tabs: ContentTypeTab[];
  onTabChange: (tabId: string) => void;
  showBookmarks?: boolean;
  onBookmarksClick?: () => void;
  onSettingsClick?: () => void;
  isAuthenticated?: boolean;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeTab,
  tabs,
  onTabChange,
  showBookmarks = false,
  onBookmarksClick,
  onSettingsClick,
  isAuthenticated = false
}) => {
  return (
    <nav className="sidebar-nav">

      <div className="sidebar-nav-section">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="sidebar-nav-icon">{tab.icon}</span>
            <span className="sidebar-nav-label">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="sidebar-nav-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {isAuthenticated && (
        <>
          <div className="sidebar-nav-divider" />
          
          <div className="sidebar-nav-section">
            {showBookmarks && onBookmarksClick && (
              <button
                onClick={onBookmarksClick}
                className="sidebar-nav-item"
              >
                <span className="sidebar-nav-icon">🔖</span>
                <span className="sidebar-nav-label">Bookmarks</span>
              </button>
            )}
            
            {onSettingsClick && (
              <button
                onClick={onSettingsClick}
                className="sidebar-nav-item"
              >
                <span className="sidebar-nav-icon">⚙️</span>
                <span className="sidebar-nav-label">Settings</span>
              </button>
            )}
          </div>
        </>
      )}
    </nav>
  );
};

export default SidebarNavigation;
