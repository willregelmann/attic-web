import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // TODO: Send error to monitoring service (e.g., Sentry)
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    // Optionally reload the page or navigate to home
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-[#667eea] to-[#764ba2]">
          <div className="bg-white rounded-xl p-8 md:p-10 max-w-xl w-full text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
            <div className="w-20 h-20 mx-auto mb-6 text-red-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              Something went wrong
            </h1>

            <p className="text-sm md:text-base text-gray-500 leading-relaxed mb-8">
              We're sorry, but something unexpected happened.
              The error has been logged and we'll look into it.
            </p>

            <div className="flex flex-col md:flex-row gap-3 justify-center">
              <button
                className="py-3 px-6 rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 border-none bg-[#667eea] text-white hover:bg-[#5568d3] hover:-translate-y-px hover:shadow-lg w-full md:w-auto"
                onClick={this.handleReset}
              >
                Return to Home
              </button>

              <button
                className="py-3 px-6 rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 border-none bg-gray-100 text-gray-700 hover:bg-gray-200 hover:-translate-y-px w-full md:w-auto"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="cursor-pointer font-semibold text-gray-700 select-none hover:text-[#667eea]">
                  Error Details (Development Only)
                </summary>
                <div className="mt-4 text-sm text-gray-500">
                  <p className="mb-3"><strong>Error:</strong> {this.state.error.toString()}</p>
                  {this.state.errorInfo && (
                    <pre className="bg-gray-800 text-gray-100 p-3 rounded-md overflow-x-auto text-xs leading-relaxed m-0">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
