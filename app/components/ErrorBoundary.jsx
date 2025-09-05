'use client';
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback p-8 m-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-2xl font-bold text-red-800 mb-4">
            {this.props.fallbackTitle || 'Something went wrong'}
          </h2>
          <p className="text-red-600 mb-4">
            {this.props.fallbackMessage || 'An error occurred while rendering this component.'}
          </p>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mb-4">
              <summary className="cursor-pointer text-red-700 font-semibold">
                Error Details (Development Only)
              </summary>
              <pre className="mt-2 p-4 bg-red-100 text-red-800 text-xs overflow-auto rounded">
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;