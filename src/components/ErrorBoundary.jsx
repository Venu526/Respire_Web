import React from 'react';
import './ErrorBoundary.css';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Core Application Error:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <div className="error-boundary__container">
                        <div className="error-boundary__icon">
                            <AlertTriangle size={48} />
                        </div>
                        <h1 className="error-boundary__title">Something went wrong</h1>
                        <p className="error-boundary__text">
                            RespireAI encountered an unexpected error. Don't worry, your health data is safe.
                        </p>
                        <div className="error-boundary__actions">
                            <button className="error-boundary__btn error-boundary__btn--primary" onClick={this.handleReload}>
                                <RefreshCcw size={18} />
                                <span>Retry Page</span>
                            </button>
                            <button className="error-boundary__btn error-boundary__btn--secondary" onClick={this.handleGoHome}>
                                <Home size={18} />
                                <span>Go to Dashboard</span>
                            </button>
                        </div>
                        {process.env.NODE_ENV === 'development' && (
                            <div className="error-boundary__debug">
                                <details>
                                    <summary>View Debug Info</summary>
                                    <pre>{this.state.error?.toString()}</pre>
                                </details>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
