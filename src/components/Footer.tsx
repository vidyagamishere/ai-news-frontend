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
              <strong>Legal:</strong>
              <Link to="/privacy">Privacy Policy</Link>
            </div>
            
            <div className="footer-group">
              <strong>Contact:</strong>
              <a href="mailto:admin@vidyagam.com">Contact Us</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Vidyagam. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;