import React, { useState, useRef } from 'react';
import './CaseSubmission.css';
import { apiClient } from './services/authService';

function CaseSubmission({ onSuccess, onClose }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    caseType: '',
    priority: '',
    location: '',
    expertiseTags: [],
    preferredLanguage: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [customCaseType, setCustomCaseType] = useState('');
  const [customLanguage, setCustomLanguage] = useState('');
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG`);
      } else if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large. Maximum size is 10MB`);
      } else {
        validFiles.push({
          file,
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type
        });
      }
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
    e.target.value = ''; // Reset input
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    const fakeEvent = { target: { files } };
    handleFileSelect(fakeEvent);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const caseTypes = [
    'Civil Law',
    'Criminal Law',
    'Family Law',
    'Property Law',
    'Labor Law',
    'Constitutional Law',
    'Consumer Protection',
    'Human Rights',
    'Immigration',
    'Tax Law',
    'Environmental Law',
    'Other'
  ];

  const expertiseTags = [
    'Divorce',
    'Child Custody',
    'Real Estate',
    'Discrimination',
    'Fraud',
    'Employment',
    'Domestic Violence',
    'Debt',
    'Tenant Rights',
    'Immigration',
    'Personal Injury',
    'Contract Dispute'
  ];

  const priorities = [
    { value: 'LOW', label: 'Low Priority' },
    { value: 'MEDIUM', label: 'Medium Priority' },
    { value: 'HIGH', label: 'High Priority' },
    { value: 'URGENT', label: 'Urgent' }
  ];

  const languages = [
    'English',
    'Spanish',
    'French',
    'Mandarin',
    'Hindi',
    'Arabic',
    'Portuguese',
    'Other'
  ];

  const steps = [
    { number: 1, title: 'Details' },
    { number: 2, title: 'Location & Parties' },
    { number: 3, title: 'Evidence' },
    { number: 4, title: 'Review' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toggleExpertiseTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      expertiseTags: prev.expertiseTags.includes(tag)
        ? prev.expertiseTags.filter(t => t !== tag)
        : [...prev.expertiseTags, tag]
    }));
  };

  const addCustomTag = () => {
    const trimmedTag = customTag.trim();
    if (trimmedTag && !formData.expertiseTags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        expertiseTags: [...prev.expertiseTags, trimmedTag]
      }));
      setCustomTag('');
    }
  };

  const removeExpertiseTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      expertiseTags: prev.expertiseTags.filter(t => t !== tagToRemove)
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Case title is required';
    } else if (formData.title.trim().length < 10) {
      newErrors.title = 'Title should be at least 10 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Case summary is required';
    } else if (formData.description.trim().length < 50) {
      newErrors.description = 'Please provide at least 50 characters describing your case';
    }

    if (!formData.caseType) {
      newErrors.caseType = 'Please select a case type';
    }

    if (formData.expertiseTags.length === 0) {
      newErrors.expertiseTags = 'Please select at least one expertise tag';
    }

    if (!formData.preferredLanguage) {
      newErrors.preferredLanguage = 'Please select your preferred language';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.priority) {
      newErrors.priority = 'Please select case priority';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) {
      return;
    }
    if (currentStep === 2 && !validateStep2()) {
      return;
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = () => {
    localStorage.setItem('caseDraft', JSON.stringify(formData));
    alert('Draft saved successfully! You can continue later from where you left off.');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrors({});

    try {
      // Map frontend data to backend CreateCaseRequest DTO
      const caseData = {
        title: formData.title,
        description: formData.description,
        caseType: formData.caseType === 'Other' ? customCaseType : formData.caseType,
        priority: formData.priority,
        // The following fields are not currently in the backend but we send them anyway
        // or we could update the backend to support them.
        location: formData.location,
        expertiseTags: formData.expertiseTags,
        preferredLanguage: formData.preferredLanguage === 'Other' ? customLanguage : formData.preferredLanguage
      };

      const response = await apiClient.post('/cases', caseData);

      if (response.status === 200 || response.status === 201) {
        alert('Case submitted successfully!');
        localStorage.removeItem('caseDraft');
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }
    } catch (error) {
      console.error('Error submitting case:', error);
      alert(error.response?.data?.message || 'Failed to submit case. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="case-steps-container">
      <div className="case-steps-progress">
        <div
          className="case-steps-progress-bar"
          style={{ width: `${(currentStep / 4) * 100}%` }}
        />
      </div>
      <div className="case-steps">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`case-step ${currentStep >= step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''
              }`}
          >
            <div className="case-step-number">
              {currentStep > step.number ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.3337 4L6.00033 11.3333L2.66699 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                step.number
              )}
            </div>
            <div className="case-step-title">{step.title}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="case-form-step">
      <div className="case-form-section">
        <label className="case-form-label">
          Case Title <span className="required">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Brief title for your case"
          className={`case-form-input ${errors.title ? 'error' : ''}`}
        />
        {errors.title && <span className="error-message">{errors.title}</span>}
      </div>

      <div className="case-form-section">
        <label className="case-form-label">
          Case Summary <span className="required">*</span>
          <span className="label-hint">(in plain language)</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Briefly describe your situation, who is involved, and what outcome you are seeking.&#10;&#10;Focus on clarity and key facts. Avoid legal jargon."
          className={`case-form-textarea ${errors.description ? 'error' : ''}`}
          rows="6"
        />
        {errors.description && <span className="error-message">{errors.description}</span>}
        <div className="char-count">{formData.description.length} characters</div>
      </div>

      <div className="case-form-section">
        <label className="case-form-label">
          Case Type <span className="required">*</span>
        </label>
        <select
          name="caseType"
          value={formData.caseType}
          onChange={handleChange}
          className={`case-form-select ${errors.caseType ? 'error' : ''}`}
        >
          <option value="">Select case type</option>
          {caseTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        {formData.caseType === 'Other' && (
          <input
            type="text"
            value={customCaseType}
            onChange={(e) => setCustomCaseType(e.target.value)}
            placeholder="Please specify case type"
            className="case-form-input"
            style={{ marginTop: '12px' }}
          />
        )}
        {errors.caseType && <span className="error-message">{errors.caseType}</span>}
      </div>

      <div className="case-form-section">
        <label className="case-form-label">
          Expertise Tags <span className="required">*</span>
        </label>

        {/* Selected Tags */}
        {formData.expertiseTags.length > 0 && (
          <div className="selected-tags">
            {formData.expertiseTags.map(tag => (
              <span key={tag} className="selected-tag">
                {tag}
                <button
                  type="button"
                  onClick={() => removeExpertiseTag(tag)}
                  className="remove-tag-btn"
                  aria-label="Remove tag"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Predefined Tags */}
        <div className="expertise-tags">
          {expertiseTags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleExpertiseTag(tag)}
              className={`expertise-tag ${formData.expertiseTags.includes(tag) ? 'selected' : ''}`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Custom Tag Input */}
        <div className="custom-tag-input">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
            placeholder="Type custom tag and press Enter"
            className="case-form-input"
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="add-tag-btn"
          >
            Add
          </button>
        </div>

        <p className="field-hint">Select from options above or add your own custom tag.</p>
        {errors.expertiseTags && <span className="error-message">{errors.expertiseTags}</span>}
      </div>

      <div className="case-form-section">
        <label className="case-form-label">
          Preferred Language <span className="required">*</span>
        </label>
        <select
          name="preferredLanguage"
          value={formData.preferredLanguage}
          onChange={handleChange}
          className={`case-form-select ${errors.preferredLanguage ? 'error' : ''}`}
        >
          <option value="">Select preferred language</option>
          {languages.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
        {formData.preferredLanguage === 'Other' && (
          <input
            type="text"
            value={customLanguage}
            onChange={(e) => setCustomLanguage(e.target.value)}
            placeholder="Please specify language"
            className="case-form-input"
            style={{ marginTop: '12px' }}
          />
        )}
        {errors.preferredLanguage && <span className="error-message">{errors.preferredLanguage}</span>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="case-form-step">
      <div className="case-form-section">
        <label className="case-form-label">
          Location <span className="required">*</span>
        </label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="City, State or Region"
          className={`case-form-input ${errors.location ? 'error' : ''}`}
        />
        {errors.location && <span className="error-message">{errors.location}</span>}
        <p className="field-hint">This helps us connect you with local legal assistance.</p>
      </div>

      <div className="case-form-section">
        <label className="case-form-label">
          Case Priority <span className="required">*</span>
        </label>
        <div className="priority-options">
          {priorities.map(priority => (
            <label key={priority.value} className="priority-option">
              <input
                type="radio"
                name="priority"
                value={priority.value}
                checked={formData.priority === priority.value}
                onChange={handleChange}
              />
              <span className={`priority-label priority-${priority.value.toLowerCase()}`}>
                {priority.label}
              </span>
            </label>
          ))}
        </div>
        {errors.priority && <span className="error-message">{errors.priority}</span>}
      </div>

      <div className="case-form-section">
        <label className="case-form-label">
          Additional Parties Involved <span className="optional">(Optional)</span>
        </label>
        <textarea
          name="parties"
          value={formData.parties || ''}
          onChange={handleChange}
          placeholder="List any other parties involved in this case (e.g., opposing party, witnesses, etc.)"
          className="case-form-textarea"
          rows="3"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="case-form-step">
      <div className="case-evidence-section">
        <div className="evidence-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3>Evidence & Documents</h3>
        <p className="evidence-description">
          Upload any relevant documents that support your case. This could include contracts,
          emails, photographs, police reports, or any other evidence.
        </p>

        <div
          className="upload-area"
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
          />
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="upload-text">
            <strong>Click to upload</strong> or drag and drop
          </p>
          <p className="upload-hint">PDF, DOC, DOCX, JPG, PNG (Max 10MB per file)</p>
          <button type="button" className="upload-btn" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Choose Files</button>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="uploaded-files-list">
            <h4>Uploaded Files ({uploadedFiles.length})</h4>
            {uploadedFiles.map(file => (
              <div key={file.id} className="uploaded-file-item">
                <div className="file-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                </div>
                <button type="button" className="remove-file-btn" onClick={() => removeFile(file.id)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="info-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong>Privacy & Security</strong>
            <p>All documents are encrypted and stored securely. Only you and your matched legal professionals can access them.</p>
          </div>
        </div>

        <p className="skip-note">You can skip this step and upload documents later if needed.</p>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="case-form-step">
      <div className="review-section">
        <h3 className="review-title">Review Your Submission</h3>
        <p className="review-subtitle">Please review all information before submitting</p>

        <div className="review-card">
          <div className="review-header">
            <h4>Case Details</h4>
            <button type="button" onClick={() => setCurrentStep(1)} className="edit-btn">
              Edit
            </button>
          </div>
          <div className="review-item">
            <span className="review-label">Case Type:</span>
            <span className="review-value">{formData.caseType || 'Not specified'}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Summary:</span>
            <span className="review-value">{formData.description || 'Not provided'}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Expertise Tags:</span>
            <div className="review-tags">
              {formData.expertiseTags.length > 0 ? formData.expertiseTags.map(tag => (
                <span key={tag} className="review-tag">{tag}</span>
              )) : 'None selected'}
            </div>
          </div>
          <div className="review-item">
            <span className="review-label">Preferred Language:</span>
            <span className="review-value">{formData.preferredLanguage || 'Not specified'}</span>
          </div>
        </div>

        <div className="review-card">
          <div className="review-header">
            <h4>Location & Priority</h4>
            <button type="button" onClick={() => setCurrentStep(2)} className="edit-btn">
              Edit
            </button>
          </div>
          <div className="review-item">
            <span className="review-label">Title:</span>
            <span className="review-value">{formData.title || 'Not provided'}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Location:</span>
            <span className="review-value">{formData.location || 'Not specified'}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Priority:</span>
            <span className={`review-value priority-badge priority-${(formData.priority || 'medium').toLowerCase()}`}>
              {formData.priority || 'Not set'}
            </span>
          </div>
        </div>

        <div className="consent-section">
          <label className="consent-checkbox">
            <input type="checkbox" required />
            <span>
              I confirm that all information provided is accurate and I understand that
              providing false information may affect my case.
            </span>
          </label>
          <label className="consent-checkbox">
            <input type="checkbox" required />
            <span>
              I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="case-submission-content">
      <div className="case-content-wrapper">
        {renderStepIndicator()}

        <div className="case-form-content">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        <div className="case-submission-footer">
          <div className="footer-left">
            {currentStep < 4 && (
              <button
                type="button"
                onClick={handleSaveDraft}
                className="case-btn case-btn-secondary"
              >
                Save Draft
              </button>
            )}
          </div>
          <div className="footer-right">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="case-btn case-btn-outline"
              >
                Back
              </button>
            )}
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="case-btn case-btn-primary"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="case-btn case-btn-primary"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Case'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaseSubmission;
