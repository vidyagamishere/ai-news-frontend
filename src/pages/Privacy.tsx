import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

const Privacy: React.FC = () => {
  return (
    <div className="legal-page">
      <SEO 
        title="Privacy Policy | Vidyagam"
        description="Privacy policy for Vidyagam detailing data collection, usage, and protection practices for our AI news service."
        url="/privacy"
      />
      <div className="legal-container">
        <div className="legal-header">
          <Link to="/" className="back-link">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last updated: January 3, 2025</p>
        </div>

        <div className="legal-content">
          <section>
            <h2>1. Information We Collect</h2>
            <h3>1.1 Personal Information</h3>
            <ul>
              <li>Name and email address</li>
              <li>Age range for demographic analysis</li>
              <li>Professional industry and occupation</li>
              <li>AI expertise level (beginner to expert)</li>
              <li>Topic interests and preferences</li>
              <li>Newsletter subscription preferences</li>
            </ul>

            <h3>1.2 Usage Information</h3>
            <ul>
              <li>Articles viewed and interaction patterns</li>
              <li>Time spent on different content types</li>
              <li>Device and browser information</li>
              <li>IP address and location data</li>
            </ul>
          </section>

          <section>
            <h2>2. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul>
              <li>Personalize your AI news feed</li>
              <li>Send relevant newsletter content</li>
              <li>Improve our recommendation algorithms</li>
              <li>Analyze usage patterns to enhance the service</li>
              <li>Communicate service updates and new features</li>
            </ul>
          </section>

          <section>
            <h2>3. Data Sharing and Disclosure</h2>
            <p>We do not sell or rent your personal information. We may share data only in these circumstances:</p>
            <ul>
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>In aggregated, anonymous form for analytics</li>
            </ul>
          </section>

          <section>
            <h2>4. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your data:</p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
              <li>Secure data centers and infrastructure</li>
            </ul>
          </section>

          <section>
            <h2>5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Opt-out of email communications</li>
            </ul>
          </section>

          <section>
            <h2>6. Cookies and Tracking</h2>
            <p>We use cookies and similar technologies to:</p>
            <ul>
              <li>Maintain your login session</li>
              <li>Remember your preferences</li>
              <li>Analyze site usage and performance</li>
              <li>Personalize content recommendations</li>
            </ul>
          </section>

          <section>
            <h2>7. Third-Party Services</h2>
            <p>Our service integrates with third-party providers:</p>
            <ul>
              <li>Google OAuth for authentication</li>
              <li>Analytics services for usage insights</li>
              <li>Email service providers for newsletters</li>
            </ul>
            <p>These services have their own privacy policies.</p>
          </section>

          <section>
            <h2>8. Data Retention</h2>
            <p>We retain your data for as long as your account is active or as needed to provide services. You may request data deletion at any time.</p>
          </section>

          <section>
            <h2>9. Children's Privacy</h2>
            <p>Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>
          </section>

          <section>
            <h2>10. Changes to Privacy Policy</h2>
            <p>We may update this privacy policy periodically. We will notify users of significant changes via email or service notifications.</p>
          </section>

          <section>
            <h2>11. Contact Us</h2>
            <p>For privacy-related questions or concerns, please contact us through our support channels.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;