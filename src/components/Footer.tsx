import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>Vidyagam</h3>
            <p>Gaining Knowledge, Filtered for You</p>
          </div>
          
          <div className="footer-links">
            <div className="footer-group">
              <strong>Product:</strong>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/auth">Sign In</Link>
              <Link to="/auth?mode=signup">Sign Up</Link>
            </div>
            
            <div className="footer-group">
              <strong>Legal:</strong>
              <Link to="/terms">Terms</Link>
              <Link to="/privacy">Privacy</Link>
            </div>
            
            <div className="footer-group">
              <strong>Contact:</strong>
              <a href="mailto:admin@vidyagam.com">Support</a>
              <a href="mailto:admin@vidyagam.com">Feedback</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Vidyagam. All rights reserved. We aggregate content from publicly available sources under fair use principles.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;