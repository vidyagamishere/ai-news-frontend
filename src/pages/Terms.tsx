import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

const Terms: React.FC = () => {
  return (
    <div className="legal-page">
      <SEO 
        title="Terms of Service | Vidyagam"
        description="Terms and conditions for using Vidyagam, including copyright compliance and user agreements for AI news aggregation service."
        url="/terms"
      />
      <div className="legal-container">
        <div className="legal-header">
          <Link to="/" className="back-link">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <h1>Terms of Service</h1>
          <p className="last-updated">Last updated: January 3, 2025</p>
        </div>

        <div className="legal-content">
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using AI News Digest ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.</p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>AI News Digest is a news aggregation and delivery service that provides curated artificial intelligence news, insights, and updates from various publicly available sources across the internet.</p>
          </section>

          <section>
            <h2>3. Copyright and Intellectual Property</h2>
            <h3>3.1 Content Sources</h3>
            <p>AI News Digest aggregates news content from publicly available sources on the internet. We do not claim ownership of the original content and respect all copyright laws. All aggregated content remains the property of its original creators and publishers.</p>
            
            <h3>3.2 Fair Use</h3>
            <p>Our service operates under fair use principles by:</p>
            <ul>
              <li>Providing brief excerpts and summaries of original content</li>
              <li>Always attributing content to original sources</li>
              <li>Providing direct links to original articles</li>
              <li>Not reproducing full articles without permission</li>
              <li>Operating for educational and informational purposes</li>
            </ul>

            <h3>3.3 DMCA Compliance</h3>
            <p>We respect copyright laws and will respond promptly to valid DMCA takedown requests. If you believe your content has been used inappropriately, please contact us immediately.</p>
          </section>

          <section>
            <h2>4. User Data Collection</h2>
            <p>By using our service, you consent to the collection and use of the following information:</p>
            <ul>
              <li>Basic profile information (name, email, age range)</li>
              <li>Professional information (industry, occupation)</li>
              <li>AI expertise level and learning preferences</li>
              <li>Topic interests and content preferences</li>
              <li>Newsletter subscription preferences</li>
              <li>Usage analytics and interaction data</li>
            </ul>
            <p>This data is used solely to personalize your experience and improve our service.</p>
          </section>

          <section>
            <h2>5. Privacy and Data Protection</h2>
            <p>Your privacy is important to us. We:</p>
            <ul>
              <li>Never sell or share your personal data with third parties</li>
              <li>Use industry-standard security measures to protect your data</li>
              <li>Allow you to update or delete your data at any time</li>
              <li>Comply with applicable privacy laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2>6. Newsletter and Communications</h2>
            <p>By subscribing to our newsletter, you agree to receive:</p>
            <ul>
              <li>Weekly AI news digests</li>
              <li>Personalized content recommendations</li>
              <li>Service updates and feature announcements</li>
              <li>Educational content related to artificial intelligence</li>
            </ul>
            <p>You may unsubscribe at any time through your account settings or email links.</p>
          </section>

          <section>
            <h2>7. User Responsibilities</h2>
            <p>Users agree to:</p>
            <ul>
              <li>Provide accurate and truthful information</li>
              <li>Use the service for lawful purposes only</li>
              <li>Respect intellectual property rights</li>
              <li>Not attempt to circumvent security measures</li>
              <li>Not share account credentials with others</li>
            </ul>
          </section>

          <section>
            <h2>8. Content Disclaimer</h2>
            <p>AI News Digest provides content for informational purposes only. We make no warranties about the accuracy, reliability, or completeness of the information provided. Users should verify information from original sources before making decisions based on aggregated content.</p>
          </section>

          <section>
            <h2>9. Limitation of Liability</h2>
            <p>AI News Digest shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.</p>
          </section>

          <section>
            <h2>10. Third-Party Links</h2>
            <p>Our service contains links to third-party websites. We are not responsible for the content, privacy policies, or practices of these external sites.</p>
          </section>

          <section>
            <h2>11. Service Modifications</h2>
            <p>We reserve the right to modify, suspend, or discontinue the service at any time with reasonable notice to users.</p>
          </section>

          <section>
            <h2>12. Termination</h2>
            <p>We may terminate or suspend your account if you violate these terms or engage in prohibited activities.</p>
          </section>

          <section>
            <h2>13. Changes to Terms</h2>
            <p>We may update these terms periodically. Continued use of the service after changes constitutes acceptance of new terms.</p>
          </section>

          <section>
            <h2>14. Governing Law</h2>
            <p>These terms are governed by applicable laws. Any disputes will be resolved through appropriate legal channels.</p>
          </section>

          <section>
            <h2>15. Contact Information</h2>
            <p>For questions about these terms or to report copyright concerns, please contact us through our support channels.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;