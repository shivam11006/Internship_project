import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>Something went wrong</h1>
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6d28d9',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Reload Page
          </button>
          <details style={{ marginTop: '2rem', maxWidth: '600px' }}>
            <summary style={{ cursor: 'pointer', color: '#64748b' }}>Error Details</summary>
            <pre style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {this.state.error?.stack || JSON.stringify(this.state.error, null, 2)}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
