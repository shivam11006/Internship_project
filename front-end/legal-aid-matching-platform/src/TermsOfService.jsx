import React from 'react';
import './Modal.css';

function TermsOfService({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content terms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Terms of Service</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <section>
            <h3>1. Acceptance of Terms</h3>
            <p>
              By accessing and using LegalMatch Pro ("the Platform"), you accept and agree to be bound by 
              these Terms of Service. If you do not agree to these terms, please do not use the Platform.
            </p>
          </section>

          <section>
            <h3>2. Service Description</h3>
            <p>
              LegalMatch Pro is a platform that connects citizens seeking legal assistance with qualified 
              lawyers and NGOs. We provide:
            </p>
            <ul>
              <li>Case submission and management tools</li>
              <li>Automated matching with legal service providers</li>
              <li>Secure communication channels</li>
              <li>Document management and sharing</li>
            </ul>
          </section>

          <section>
            <h3>3. User Responsibilities</h3>
            <p>As a user of this platform, you agree to:</p>
            <ul>
              <li>Provide accurate and truthful information</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Use the platform only for lawful purposes</li>
              <li>Respect the privacy and rights of other users</li>
              <li>Not engage in fraudulent activities or misrepresentation</li>
            </ul>
          </section>

          <section>
            <h3>4. Case Submissions</h3>
            <p>
              When submitting a case through the platform:
            </p>
            <ul>
              <li>You certify that all information provided is accurate and complete</li>
              <li>You grant us permission to share case details with matched legal providers</li>
              <li>You understand that case matching is automated and based on various criteria</li>
              <li>You acknowledge that final acceptance of your case is at the provider's discretion</li>
            </ul>
          </section>

          <section>
            <h3>5. Legal Service Provider Terms</h3>
            <p>
              For lawyers and NGOs using the platform:
            </p>
            <ul>
              <li>You must maintain valid credentials and qualifications</li>
              <li>You are responsible for verifying case details before acceptance</li>
              <li>You agree to provide professional services to accepted cases</li>
              <li>You must adhere to professional ethical standards</li>
              <li>The platform does not guarantee case assignments</li>
            </ul>
          </section>

          <section>
            <h3>6. Limitation of Liability</h3>
            <p>
              LegalMatch Pro serves as a connecting platform only. We:
            </p>
            <ul>
              <li>Do not provide legal advice or representation</li>
              <li>Are not responsible for the quality of services provided by legal professionals</li>
              <li>Do not guarantee outcomes of legal cases</li>
              <li>Are not liable for losses arising from use of the platform</li>
            </ul>
          </section>

          <section>
            <h3>7. Fees and Payments</h3>
            <p>
              The platform connection service is provided at no cost. Any fees for legal services 
              are negotiated directly between citizens and legal service providers. LegalMatch Pro 
              is not involved in payment transactions between parties.
            </p>
          </section>

          <section>
            <h3>8. Data and Privacy</h3>
            <p>
              Your use of the platform is also governed by our Privacy Policy. We collect and use 
              personal information as described in the Privacy Policy to provide and improve our services.
            </p>
          </section>

          <section>
            <h3>9. Termination</h3>
            <p>
              We reserve the right to suspend or terminate access to the platform for:
            </p>
            <ul>
              <li>Violation of these Terms of Service</li>
              <li>Fraudulent or illegal activities</li>
              <li>Misuse of the platform</li>
              <li>Provision of false information</li>
            </ul>
          </section>

          <section>
            <h3>10. Modifications</h3>
            <p>
              We may modify these Terms of Service at any time. Continued use of the platform after 
              changes constitutes acceptance of the modified terms. We will notify users of significant 
              changes via email or platform notifications.
            </p>
          </section>

          <section>
            <h3>11. Dispute Resolution</h3>
            <p>
              Any disputes arising from use of the platform shall be resolved through arbitration 
              in accordance with applicable laws. Users agree to first attempt resolution through 
              our support channels before pursuing legal action.
            </p>
          </section>

          <section>
            <h3>12. Contact Information</h3>
            <p>
              For questions about these Terms of Service, please contact us at:
              <br />
              Email: support@legalmatchpro.com
              <br />
              Address: Legal Aid Services, Main Office
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

export default TermsOfService;
