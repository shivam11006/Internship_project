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
    role: 'citizen',
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
          role: 'citizen'
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
        <h1 className="signup-title">Create Account</h1>
        <p className="signup-subtitle">
          Join our legal aid platform
        </p>

        <div className="social-buttons">
          <button className="social-btn google-btn" type="button">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="#4285F4"/>
              <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
              <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
              <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <button className="social-btn apple-btn" type="button">
            <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.7528 16.5819C17.4219 17.3959 17.0174 18.1443 16.5377 18.8317C15.8849 19.7664 15.3447 20.4089 14.9209 20.7593C14.2681 21.3405 13.5671 21.6383 12.8151 21.6552C12.267 21.6552 11.6087 21.4946 10.8446 21.1689C10.0778 20.8446 9.37679 20.6841 8.74064 20.6841C8.07332 20.6841 7.35283 20.8446 6.57777 21.1689C5.80177 21.4946 5.17469 21.6636 4.69319 21.6789C3.97223 21.7073 3.25454 21.4012 2.53924 20.7593C2.08204 20.3773 1.52049 19.7119 0.854593 18.7632C0.140869 17.7538 0.551964 16.8218 0.0909424 15.9515C-0.363136 15.1237 -0.636322 14.3337 -0.636322 13.5802C-0.636322 12.7033 -0.412766 11.9422 0.0344238 11.2945C0.376672 10.8004 0.816879 10.4115 1.35729 10.1275C1.89771 9.84354 2.48077 9.69864 3.10879 9.68189C3.68892 9.68189 4.42157 9.86448 5.31216 10.2244C6.20037 10.5858 6.78754 10.7684 7.07084 10.7684C7.27524 10.7684 7.92567 10.5601 8.91431 10.1447C9.85657 9.7577 10.6471 9.59364 11.2897 9.6485C12.9826 9.78296 14.2708 10.4559 15.148 11.6707C13.6481 12.5943 12.906 13.8677 12.922 15.4869C12.9366 16.7648 13.4145 17.8466 14.3525 18.7274C14.7794 19.1364 15.2547 19.4521 15.7829 19.676C15.6649 20.0122 15.5411 20.3349 15.41 20.6449L17.7528 16.5819ZM11.4165 0.869171C11.4165 1.85867 11.0453 2.77652 10.3057 3.61819C9.40918 4.62724 8.33197 5.20851 7.16644 5.10296C7.15025 4.97545 7.14087 4.84145 7.14087 4.70092C7.14087 3.74915 7.56337 2.73333 8.31719 1.91106C8.69349 1.49564 9.16798 1.15088 9.74064 0.876777C10.3119 0.606857 10.8554 0.459167 11.3698 0.433105C11.3861 0.578976 11.4165 0.724862 11.4165 0.869156V0.869171Z" fill="black"/>
            </svg>
            Continue with Apple
          </button>
        </div>

        <div className="divider">
          <span>Or sign up with email</span>
        </div>

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
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="Enter your full name"
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
            <label htmlFor="email">Email</label>
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

          {/* Role */}
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <div className="input-wrapper">
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="Citizen">Citizen</option>
                <option value="Lawyer">Lawyer</option>
                <option value="NGO">NGO</option>
              </select>
            </div>
            {errors.role && <p className="error-text">{errors.role}</p>}
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

