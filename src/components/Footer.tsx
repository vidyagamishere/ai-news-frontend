import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>AI News Digest</h3>
            <p>Stay ahead in AI with personalized news and insights.</p>
          </div>
          
          <div className="footer-section">
            <h4>Product</h4>
            <ul>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/auth">Sign In</Link></li>
              <li><Link to="/auth?mode=signup">Sign Up</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Contact</h4>
            <ul>
              <li><a href="mailto:admin@vidyagam.com">Support</a></li>
              <li><a href="mailto:admin@vidyagam.com">Feedback</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 AI News Digest. All rights reserved.</p>
          <p className="copyright-notice">
            We aggregate content from publicly available sources under fair use principles. 
            All original content remains the property of its respective creators.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;