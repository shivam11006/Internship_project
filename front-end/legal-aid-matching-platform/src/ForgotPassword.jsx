import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateEmail, validatePassword, validateConfirmPassword, VALIDATION_PATTERNS } from './utils/validationUtils';
import './ForgotPassword.css';

function ForgotPassword() {
  // Step management: 1 = Email, 2 = OTP, 3 = New Password
  const [step, setStep] = useState(1);
  
  // Form data
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const navigate = useNavigate();
  const otpRefs = useRef([]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP keydown for backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    
    // Focus on the last filled input or the next empty one
    const focusIndex = Math.min(pastedData.length, 5);
    otpRefs.current[focusIndex]?.focus();
  };

  // Step 1: Send OTP to email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.message);
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage('OTP has been sent to your email address.');
        setStep(2);
        setResendCooldown(60); // 60 seconds cooldown
      } else {
        setError(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter a complete 6-digit OTP.');
      return;
    }
    
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('http://localhost:8080/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await response.json();
      
      if (response.ok && data.verified) {
        setMessage('OTP verified successfully!');
        setStep(3);
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('http://localhost:8080/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('A new OTP has been sent to your email.');
        setOtp(['', '', '', '', '', '']);
        setResendCooldown(60);
        otpRefs.current[0]?.focus();
      } else {
        setError(data.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    // Validate password with strong requirements
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }
    
    // Validate confirm password
    const confirmValidation = validateConfirmPassword(password, confirmPassword);
    if (!confirmValidation.isValid) {
      setError(confirmValidation.message);
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: password }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage('Password reset successful! Redirecting to sign in...');
        setTimeout(() => navigate('/signin'), 2000);
      } else {
        setError(data.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
        <div className="step-number">{step > 1 ? '✓' : '1'}</div>
        <span>Email</span>
      </div>
      <div className="step-line"></div>
      <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
        <div className="step-number">{step > 2 ? '✓' : '2'}</div>
        <span>Verify OTP</span>
      </div>
      <div className="step-line"></div>
      <div className={`step ${step >= 3 ? 'active' : ''}`}>
        <div className="step-number">3</div>
        <span>New Password</span>
      </div>
    </div>
  );

  // Render Step 1: Email Input
  const renderEmailStep = () => (
    <form onSubmit={handleSendOtp} className="forgot-password-form">
      <div className="form-group">
        <label htmlFor="email" className="form-label">Email Address</label>
        <div className="input-wrapper">
          <input
            type="email"
            id="email"
            className="form-input no-icon"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>
      
      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? (
          <><div className="spinner-small"></div>Sending OTP...</>
        ) : (
          'Send OTP'
        )}
      </button>
    </form>
  );

  // Render Step 2: OTP Verification
  const renderOtpStep = () => (
    <form onSubmit={handleVerifyOtp} className="forgot-password-form">
      <div className="otp-sent-message">
        <p>We've sent a 6-digit OTP to <strong>{email}</strong></p>
      </div>
      
      <div className="form-group">
        <label className="form-label">Enter OTP</label>
        <div className="otp-input-container">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (otpRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength="1"
              className="otp-input"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              onPaste={index === 0 ? handleOtpPaste : undefined}
              autoFocus={index === 0}
            />
          ))}
        </div>
        <p className="otp-hint">OTP expires in 10 minutes</p>
      </div>
      
      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? (
          <><div className="spinner-small"></div>Verifying...</>
        ) : (
          'Verify OTP'
        )}
      </button>
      
      <div className="resend-otp">
        <span>Didn't receive the OTP? </span>
        {resendCooldown > 0 ? (
          <span className="cooldown">Resend in {resendCooldown}s</span>
        ) : (
          <button type="button" className="resend-btn" onClick={handleResendOtp} disabled={loading}>
            Resend OTP
          </button>
        )}
      </div>
      
      <button type="button" className="back-step-btn" onClick={() => { setStep(1); setError(''); setMessage(''); }}>
        ← Change Email
      </button>
    </form>
  );

  // Render Step 3: New Password
  const renderPasswordStep = () => (
    <form onSubmit={handleResetPassword} className="forgot-password-form">
      <div className="form-group">
        <label htmlFor="password" className="form-label">New Password</label>
        <div className="input-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            className="form-input no-icon"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? (
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        <p className="form-hint">Must be at least 8 characters</p>
      </div>
      
      <div className="form-group">
        <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
        <div className="input-wrapper">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            className="form-input no-icon"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
          <button type="button" className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
            {showConfirmPassword ? (
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? (
          <><div className="spinner-small"></div>Resetting Password...</>
        ) : (
          'Reset Password'
        )}
      </button>
    </form>
  );

  // Get title and subtitle based on step
  const getStepContent = () => {
    switch (step) {
      case 1:
        return {
          title: 'Forgot Password?',
          subtitle: "Enter your email address and we'll send you an OTP to reset your password."
        };
      case 2:
        return {
          title: 'Verify OTP',
          subtitle: 'Enter the 6-digit code sent to your email.'
        };
      case 3:
        return {
          title: 'Create New Password',
          subtitle: 'Your identity has been verified. Set your new password.'
        };
      default:
        return { title: '', subtitle: '' };
    }
  };

  const { title, subtitle } = getStepContent();

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <div className="logo-section">
            <div className="logo-icon">⚖️</div>
            <h1 className="logo-title">Legal Aid Platform</h1>
          </div>
          
          {renderStepIndicator()}
          
          <h2 className="forgot-password-title">{title}</h2>
          <p className="forgot-password-subtitle">{subtitle}</p>
        </div>

        {message && (
          <div className="alert alert-success">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {message}
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {step === 1 && renderEmailStep()}
        {step === 2 && renderOtpStep()}
        {step === 3 && renderPasswordStep()}

        <div className="forgot-password-footer">
          <button type="button" className="back-btn" onClick={() => navigate('/signin')}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
