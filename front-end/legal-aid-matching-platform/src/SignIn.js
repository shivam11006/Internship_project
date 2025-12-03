import React, { useState } from 'react';
import './SignIn.css';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Sign in:', { email, password });
  };

  return (
    <div className="signin-container">
      <div className="signin-box">
        <h1 className="signin-title">Welcome Back</h1>
        <p className="signin-subtitle">Sign in to your account to continue.</p>
        
        <div className="social-buttons">
          <button className="social-btn google-btn">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="#4285F4"/>
              <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
              <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
              <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          
          <button className="social-btn apple-btn">
            <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.7528 16.5819C17.4219 17.3959 17.0174 18.1443 16.5377 18.8317C15.8849 19.7664 15.3447 20.4089 14.9209 20.7593C14.2681 21.3405 13.5671 21.6383 12.8151 21.6552C12.267 21.6552 11.6087 21.4946 10.8446 21.1689C10.0778 20.8446 9.37679 20.6841 8.74064 20.6841C8.07332 20.6841 7.35283 20.8446 6.57777 21.1689C5.80177 21.4946 5.17469 21.6636 4.69319 21.6789C3.97223 21.7073 3.25454 21.4012 2.53924 20.7593C2.08204 20.3773 1.52049 19.7119 0.854593 18.7632C0.140869 17.7538 0.551964 16.8218 0.0909424 15.9515C-0.363136 15.1237 -0.636322 14.3337 -0.636322 13.5802C-0.636322 12.7033 -0.412766 11.9422 0.0344238 11.2945C0.376672 10.8004 0.816879 10.4115 1.35729 10.1275C1.89771 9.84354 2.48077 9.69864 3.10879 9.68189C3.68892 9.68189 4.42157 9.86448 5.31216 10.2244C6.20037 10.5858 6.78754 10.7684 7.07084 10.7684C7.27524 10.7684 7.92567 10.5601 8.91431 10.1447C9.85657 9.7577 10.6471 9.59364 11.2897 9.6485C12.9826 9.78296 14.2708 10.4559 15.148 11.6707C13.6481 12.5943 12.906 13.8677 12.922 15.4869C12.9366 16.7648 13.4145 17.8466 14.3525 18.7274C14.7794 19.1364 15.2547 19.4521 15.7829 19.676C15.6649 20.0122 15.5411 20.3349 15.41 20.6449L17.7528 16.5819ZM11.4165 0.869171C11.4165 1.85867 11.0453 2.77652 10.3057 3.61819C9.40918 4.62724 8.33197 5.20851 7.16644 5.10296C7.15025 4.97545 7.14087 4.84145 7.14087 4.70092C7.14087 3.74915 7.56337 2.73333 8.31719 1.91106C8.69349 1.49564 9.16798 1.15088 9.74064 0.876777C10.3119 0.606857 10.8554 0.459167 11.3698 0.433105C11.3861 0.578976 11.4165 0.724862 11.4165 0.869156V0.869171Z" fill="black"/>
            </svg>
            Continue with Apple
          </button>
        </div>
        
        <div className="divider">
          <span>Or continue with</span>
        </div>
        
        <form onSubmit={handleSubmit} className="signin-form">
          <div className="form-group">
            <label htmlFor="email">Email or Username</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.33334 3.33334H16.6667C17.5833 3.33334 18.3333 4.08334 18.3333 5.00001V15C18.3333 15.9167 17.5833 16.6667 16.6667 16.6667H3.33334C2.41668 16.6667 1.66668 15.9167 1.66668 15V5.00001C1.66668 4.08334 2.41668 3.33334 3.33334 3.33334Z" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.3333 5L10 10.8333L1.66666 5" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="text"
                id="email"
                placeholder="Enter your email or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.8333 9.16667H4.16667C3.24619 9.16667 2.5 9.91286 2.5 10.8333V16.6667C2.5 17.5871 3.24619 18.3333 4.16667 18.3333H15.8333C16.7538 18.3333 17.5 17.5871 17.5 16.6667V10.8333C17.5 9.91286 16.7538 9.16667 15.8333 9.16667Z" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.83334 9.16667V5.83334C5.83334 4.72827 6.27233 3.66846 7.05373 2.88706C7.83513 2.10566 8.89494 1.66667 10 1.66667C11.1051 1.66667 12.1649 2.10566 12.9463 2.88706C13.7277 3.66846 14.1667 4.72827 14.1667 5.83334V9.16667" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 10C2.5 10 5 4.16667 10 4.16667C15 4.16667 17.5 10 17.5 10C17.5 10 15 15.8333 10 15.8333C5 15.8333 2.5 10 2.5 10Z" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.95 14.95C13.5255 16.0358 11.7904 16.6374 10 16.6667C5 16.6667 2.5 10.8333 2.5 10.8333C3.45644 9.06819 4.76999 7.52308 6.35 6.28333M8.25 4.53333C8.82379 4.39907 9.41118 4.33195 10 4.33333C15 4.33333 17.5 10.1667 17.5 10.1667C17.0111 11.0458 16.4335 11.8698 15.775 12.625M11.7667 11.7667C11.5378 12.0123 11.2617 12.2093 10.9552 12.3459C10.6488 12.4826 10.3184 12.5561 9.98345 12.562C9.64852 12.5679 9.31574 12.5061 9.00481 12.3803C8.69387 12.2545 8.41113 12.0672 8.17351 11.8295C7.93589 11.5919 7.74863 11.3092 7.62283 10.9982C7.49702 10.6873 7.43519 10.3545 7.44112 10.0196C7.44705 9.68464 7.52058 9.35424 7.65719 9.04779C7.7938 8.74134 7.99085 8.46524 8.23642 8.23633" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2.5 2.5L17.5 17.5" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <div className="forgot-password">
            <a href="#forgot">Forgot your password?</a>
          </div>
          
          <button type="submit" className="signin-btn">
            Log In
          </button>
        </form>
        
        <div className="signup-link">
          Don't have an account? <a href="#signup">Sign Up</a>
        </div>
        
        <div className="terms">
          By continuing, you agree to LegalMatch Pro's <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
}

export default SignIn;
