import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from './services/authService';
import { validateEmail, VALIDATION_PATTERNS } from './utils/validationUtils';
import './SignIn.css';

function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation - supports both email format and username
    if (!email.trim()) {
      newErrors.email = 'Email or username is required';
    } else if (email.includes('@')) {
      // If it looks like an email, validate as email
      if (!VALIDATION_PATTERNS.email.test(email)) {
        newErrors.email = 'Please enter a valid email address (e.g., user@example.com)';
      }
    } else {
      // If it's a username, check for alphanumeric characters
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(email)) {
        newErrors.email = 'Username must be 3-30 characters (letters, numbers, underscores only)';
      }
    }
    
    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleLogin = () => {
    alert('Google OAuth is not yet configured. Please use email/password login or contact the administrator.');
  };

  const handleGitHubLogin = () => {
    alert('GitHub OAuth is not yet configured. Please use email/password login or contact the administrator.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setApiError('');

    try {
      const response = await authService.login({ email, password });

      if (response.success) {
        const user = response.data;

        // Navigate based on user role
        switch (user.role) {
          case 'CITIZEN':
            navigate('/dashboard/citizen', { replace: true });
            break;
          case 'LAWYER':
            navigate('/dashboard/lawyer', { replace: true });
            break;
          case 'NGO':
            navigate('/dashboard/ngo', { replace: true });
            break;
          case 'ADMIN':
            navigate('/dashboard/admin', { replace: true });
            break;
          default:
            navigate('/dashboard', { replace: true });
        }
      } else {
        setApiError(response.error || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      setApiError('Unable to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-box">
        <h1 className="signin-title">Welcome Back</h1>
        <p className="signin-subtitle">Sign in to your account to continue.</p>

        <div className="social-buttons">
          <button type="button" className="social-btn google-btn" onClick={handleGoogleLogin}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="#4285F4" />
              <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853" />
              <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05" />
              <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <button type="button" className="social-btn github-btn" onClick={handleGitHubLogin}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.477 2 2 6.477 2 12C2 16.42 4.865 20.163 8.839 21.489C9.339 21.579 9.521 21.269 9.521 21.004C9.521 20.766 9.513 20.146 9.508 19.318C6.726 19.91 6.139 17.943 6.139 17.943C5.685 16.778 5.029 16.469 5.029 16.469C4.121 15.86 5.098 15.873 5.098 15.873C6.101 15.945 6.629 16.896 6.629 16.896C7.521 18.392 8.97 17.949 9.539 17.695C9.631 17.048 9.889 16.606 10.175 16.359C7.955 16.108 5.62 15.241 5.62 11.371C5.62 10.268 6.009 9.366 6.649 8.663C6.546 8.413 6.203 7.397 6.747 6.036C6.747 6.036 7.588 5.767 9.496 7.024C10.294 6.803 11.147 6.693 12 6.689C12.853 6.693 13.706 6.803 14.504 7.024C16.412 5.767 17.252 6.036 17.252 6.036C17.797 7.397 17.453 8.413 17.351 8.663C17.991 9.366 18.38 10.268 18.38 11.371C18.38 15.251 16.04 16.105 13.813 16.349C14.172 16.66 14.491 17.275 14.491 18.217C14.491 19.567 14.48 20.655 14.48 21.004C14.48 21.272 14.659 21.584 15.167 21.488C19.137 20.159 22 16.419 22 12C22 6.477 17.523 2 12 2Z" fill="#181717" />
            </svg>
            Continue with GitHub
          </button>
        </div>

        <div className="divider">
          <span>Or continue with</span>
        </div>

        {apiError && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '14px'
          }}>
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="signin-form">
          <div className="form-group">
            <label htmlFor="email">Email or Username</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="email"
                placeholder="Enter your email or username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                className={errors.email ? 'error' : ''}
              />
            </div>
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
                className={errors.password ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 10C2.5 10 5 4.16667 10 4.16667C15 4.16667 17.5 10 17.5 10C17.5 10 15 15.8333 10 15.8333C5 15.8333 2.5 10 2.5 10Z" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.95 14.95C13.5255 16.0358 11.7904 16.6374 10 16.6667C5 16.6667 2.5 10.8333 2.5 10.8333C3.45644 9.06819 4.76999 7.52308 6.35 6.28333M8.25 4.53333C8.82379 4.39907 9.41118 4.33195 10 4.33333C15 4.33333 17.5 10.1667 17.5 10.1667C17.0111 11.0458 16.4335 11.8698 15.775 12.625M11.7667 11.7667C11.5378 12.0123 11.2617 12.2093 10.9552 12.3459C10.6488 12.4826 10.3184 12.5561 9.98345 12.562C9.64852 12.5679 9.31574 12.5061 9.00481 12.3803C8.69387 12.2545 8.41113 12.0672 8.17351 11.8295C7.93589 11.5919 7.74863 11.3092 7.62283 10.9982C7.49702 10.6873 7.43519 10.3545 7.44112 10.0196C7.44705 9.68464 7.52058 9.35424 7.65719 9.04779C7.7938 8.74134 7.99085 8.46524 8.23642 8.23633" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2.5 2.5L17.5 17.5" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="forgot-password">
            <button type="button" onClick={() => navigate('/forgot-password')} className="forgot-link">Forgot your password?</button>
          </div>

          <button type="submit" className="signin-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="signup-link">
          Don't have an account? <button type="button" onClick={() => navigate('/signup')} className="toggle-link">Sign Up</button>
        </div>

        <div className="terms">
          By continuing, you agree to LegalMatch Pro's <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
}

export default SignIn;
