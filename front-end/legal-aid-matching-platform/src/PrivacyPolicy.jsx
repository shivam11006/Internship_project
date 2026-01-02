import React from 'react';
import './Modal.css';

function PrivacyPolicy({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content terms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Privacy Policy</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <section>
            <h3>1. Introduction</h3>
            <p>
              LegalMatch Pro ("we," "our," or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your 
              information when you use our platform.
            </p>
          </section>

          <section>
            <h3>2. Information We Collect</h3>
            
            <h4>2.1 Personal Information</h4>
            <p>We collect the following personal information:</p>
            <ul>
              <li>Name, email address, and phone number</li>
              <li>Location and address details</li>
              <li>User account credentials</li>
              <li>Profile information for lawyers and NGOs</li>
              <li>Professional credentials and specializations</li>
            </ul>

            <h4>2.2 Case Information</h4>
            <p>When you submit a case, we collect:</p>
            <ul>
              <li>Case descriptions and details</li>
              <li>Case type and priority level</li>
              <li>Supporting documents and evidence</li>
              <li>Preferred language and location</li>
              <li>Communication history related to the case</li>
            </ul>

            <h4>2.3 Technical Information</h4>
            <p>We automatically collect:</p>
            <ul>
              <li>IP addresses and device information</li>
              <li>Browser type and version</li>
              <li>Usage patterns and platform interactions</li>
              <li>Login timestamps and activity logs</li>
            </ul>
          </section>

          <section>
            <h3>3. How We Use Your Information</h3>
            <p>We use collected information for:</p>
            <ul>
              <li><strong>Matching Services:</strong> To connect citizens with appropriate legal service providers</li>
              <li><strong>Platform Operations:</strong> To maintain, improve, and secure the platform</li>
              <li><strong>Communication:</strong> To send notifications, updates, and support messages</li>
              <li><strong>Verification:</strong> To verify credentials of lawyers and NGOs</li>
              <li><strong>Analytics:</strong> To understand usage patterns and improve services</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations and protect rights</li>
            </ul>
          </section>

          <section>
            <h3>4. Information Sharing</h3>
            
            <h4>4.1 With Legal Service Providers</h4>
            <p>
              When matches are generated, we share relevant case information with matched lawyers 
              and NGOs to enable them to evaluate the case. This includes case details, priority, 
              location, and required expertise.
            </p>

            <h4>4.2 With Other Users</h4>
            <p>
              Once you select a legal provider, detailed case information and documents are shared 
              with the selected provider to facilitate legal assistance.
            </p>

            <h4>4.3 Service Providers</h4>
            <p>
              We may share information with third-party service providers who assist in platform 
              operations, such as hosting, analytics, and security services.
            </p>

            <h4>4.4 Legal Requirements</h4>
            <p>
              We may disclose information when required by law, court order, or government request, 
              or to protect our rights and safety.
            </p>
          </section>

          <section>
            <h3>5. Data Security</h3>
            <p>
              We implement industry-standard security measures to protect your information:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication using JWT tokens</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and permission management</li>
              <li>Secure document storage and transmission</li>
            </ul>
            <p>
              However, no method of transmission over the internet is 100% secure. We cannot 
              guarantee absolute security of your information.
            </p>
          </section>

          <section>
            <h3>6. Data Retention</h3>
            <p>
              We retain your information for as long as necessary to:
            </p>
            <ul>
              <li>Provide services to you</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce agreements</li>
              <li>Maintain audit trails for security purposes</li>
            </ul>
            <p>
              Case information is retained for a minimum of 7 years for legal and audit purposes. 
              You may request deletion of your account, subject to legal retention requirements.
            </p>
          </section>

          <section>
            <h3>7. Your Rights</h3>
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request copies of your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your information (subject to legal requirements)</li>
              <li><strong>Portability:</strong> Request transfer of your data to another service</li>
              <li><strong>Objection:</strong> Object to processing of your information</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
            </ul>
            <p>
              To exercise these rights, contact us at privacy@legalmatchpro.com
            </p>
          </section>

          <section>
            <h3>8. Cookies and Tracking</h3>
            <p>
              We use cookies and similar technologies to:
            </p>
            <ul>
              <li>Maintain your login session</li>
              <li>Remember your preferences</li>
              <li>Analyze platform usage</li>
              <li>Improve user experience</li>
            </ul>
            <p>
              You can control cookie settings through your browser preferences. Disabling cookies 
              may affect platform functionality.
            </p>
          </section>

          <section>
            <h3>9. Children's Privacy</h3>
            <p>
              The platform is not intended for users under 18 years of age. We do not knowingly 
              collect information from children. If we become aware of collection of data from 
              minors, we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h3>10. Third-Party Links</h3>
            <p>
              The platform may contain links to third-party websites. We are not responsible for 
              the privacy practices of these external sites. We encourage you to review their 
              privacy policies.
            </p>
          </section>

          <section>
            <h3>11. International Data Transfers</h3>
            <p>
              Your information may be transferred to and processed in countries other than your 
              country of residence. We ensure appropriate safeguards are in place for such transfers.
            </p>
          </section>

          <section>
            <h3>12. Changes to Privacy Policy</h3>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant 
              changes via email or platform notification. Continued use after changes constitutes 
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h3>13. Contact Us</h3>
            <p>
              For questions or concerns about this Privacy Policy or our data practices, contact us at:
            </p>
            <p>
              <strong>Email:</strong> privacy@legalmatchpro.com<br />
              <strong>Data Protection Officer:</strong> dpo@legalmatchpro.com<br />
              <strong>Address:</strong> Legal Aid Services, Main Office<br />
              <strong>Phone:</strong> +1-XXX-XXX-XXXX
            </p>
          </section>

          <p className="terms-footer">
            <strong>Last Updated:</strong> January 2, 2026
          </p>
        </div>
        <div className="modal-footer">
          <button className="case-btn case-btn-primary" onClick={onClose}>
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
