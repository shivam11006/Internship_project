import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './signup.css';
import authService from './services/authService';

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'CITIZEN',
    // Lawyer fields
    specialization: '',
    barNumber: '',
    // NGO fields
    organizationName: '',
    registrationNumber: '',
    focusArea: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      // simple email pattern
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Enter a valid email address';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    // Lawyer-specific validation
    if (formData.role === 'LAWYER') {
      if (!formData.specialization.trim()) {
        newErrors.specialization = 'Specialization is required for lawyers';
      }
      if (!formData.barNumber.trim()) {
        newErrors.barNumber = 'Bar number is required for lawyers';
      }
    }

    // NGO-specific validation
    if (formData.role === 'NGO') {
      if (!formData.organizationName.trim()) {
        newErrors.organizationName = 'Organization name is required for NGOs';
      }
      if (!formData.registrationNumber.trim()) {
        newErrors.registrationNumber = 'Registration number is required for NGOs';
      }
      if (!formData.focusArea.trim()) {
        newErrors.focusArea = 'Focus area is required for NGOs';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');

    if (!validate()) return;

    setLoading(true);

    try {
      const result = await authService.register(formData);

      if (result.success) {
        setSuccessMessage('Registration successful! Redirecting to login...');
        setFormData({
          fullName: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'CITIZEN',
        });
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
      } else {
        setApiError(result.error);
      }
    } catch (error) {
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h1 className="signup-title">Join LegalMatch as a</h1>
        
        {/* Role Tabs */}
        <div className="role-tabs">
          <button 
            type="button"
            className={`role-tab ${formData.role === 'CITIZEN' ? 'active' : ''}`}
            onClick={() => setFormData(prev => ({ ...prev, role: 'CITIZEN' }))}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Citizen</span>
          </button>
          
          <button 
            type="button"
            className={`role-tab ${formData.role === 'LAWYER' ? 'active' : ''}`}
            onClick={() => setFormData(prev => ({ ...prev, role: 'LAWYER' }))}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Lawyer</span>
          </button>
          
          <button 
            type="button"
            className={`role-tab ${formData.role === 'NGO' ? 'active' : ''}`}
            onClick={() => setFormData(prev => ({ ...prev, role: 'NGO' }))}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>NGO</span>
          </button>
        </div>

        <div className="signup-subtitle-text">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#475467" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22" stroke="#475467" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Signing up as {formData.role === 'CITIZEN' ? 'Citizen' : formData.role === 'LAWYER' ? 'Lawyer' : 'NGO'}</span>
        </div>
        <p className="subtitle-help">Get legal assistance</p>

        {apiError && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fee2e2',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '14px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            {apiError}
          </div>
        )}

        {successMessage && (
          <div style={{
            padding: '12px',
            backgroundColor: '#d4edda',
            borderRadius: '8px',
            color: '#155724',
            fontSize: '14px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="signup-form">
          {/* Username */}
          <div className="form-group">
            <label htmlFor="fullName">Username</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="Enter your username"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
            {errors.fullName && (
              <p className="error-text">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && (
              <p className="error-text">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="error-text">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Lawyer-specific fields */}
          {formData.role === 'LAWYER' && (
            <>
              <div className="form-group">
                <label htmlFor="specialization">Specialization</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="specialization"
                    name="specialization"
                    placeholder="e.g., Family Law, Criminal Law"
                    value={formData.specialization}
                    onChange={handleChange}
                  />
                </div>
                {errors.specialization && (
                  <p className="error-text">{errors.specialization}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="barNumber">Bar Number</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="barNumber"
                    name="barNumber"
                    placeholder="Enter your bar number"
                    value={formData.barNumber}
                    onChange={handleChange}
                  />
                </div>
                {errors.barNumber && (
                  <p className="error-text">{errors.barNumber}</p>
                )}
              </div>
            </>
          )}

          {/* NGO-specific fields */}
          {formData.role === 'NGO' && (
            <>
              <div className="form-group">
                <label htmlFor="organizationName">Organization Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="organizationName"
                    name="organizationName"
                    placeholder="Enter organization name"
                    value={formData.organizationName}
                    onChange={handleChange}
                  />
                </div>
                {errors.organizationName && (
                  <p className="error-text">{errors.organizationName}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="registrationNumber">Registration Number</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="registrationNumber"
                    name="registrationNumber"
                    placeholder="Enter registration number"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                  />
                </div>
                {errors.registrationNumber && (
                  <p className="error-text">{errors.registrationNumber}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="focusArea">Focus Area</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="focusArea"
                    name="focusArea"
                    placeholder="e.g., Women's Rights, Housing"
                    value={formData.focusArea}
                    onChange={handleChange}
                  />
                </div>
                {errors.focusArea && (
                  <p className="error-text">{errors.focusArea}</p>
                )}
              </div>
            </>
          )}

          <button type="submit" className="signup-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="signin-link">
          Already have an account? <button type="button" onClick={() => navigate('/signin')} className="toggle-link">Log In</button>
        </div>

        <div className="terms">
          By signing up, you agree to LegalMatch Pro's{' '}
          <a href="#terms">Terms of Service</a> and{' '}
          <a href="#privacy">Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
}

export default Signup;

