import React, { type ReactNode, useState, useEffect } from 'react';
import '../../styles/three-column-layout.css';

interface ThreeColumnLayoutProps {
  leftSidebar: ReactNode;
  mainContent: ReactNode;
  rightSidebar: ReactNode;
  showLeftSidebar?: boolean;
  showRightSidebar?: boolean;
}

const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  leftSidebar,
  mainContent,
  rightSidebar,
  showLeftSidebar = true,
  showRightSidebar = true
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when clicking backdrop
  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  // Toggle mobile sidebar - exposed globally for header hamburger
  useEffect(() => {
    (window as any).toggleMobileSidebar = () => {
      setIsMobileSidebarOpen(prev => !prev);
    };
  }, []);

  return (
    <>
      {/* Mobile hamburger menu backdrop */}
      {isMobile && (
        <div 
          className={`mobile-sidebar-backdrop ${isMobileSidebarOpen ? 'active' : ''}`}
          onClick={closeMobileSidebar}
        />
      )}
      
      <div className="three-column-container">
        {showLeftSidebar && (
          <aside className={`three-column-left-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
            {leftSidebar}
          </aside>
        )}
        
        <main className="three-column-main-content">
          {mainContent}
        </main>
        
        {showRightSidebar && (
          <aside className="three-column-right-sidebar">
            {rightSidebar}
          </aside>
        )}
      </div>
    </>
  );
};

export default ThreeColumnLayout;
