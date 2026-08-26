import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white px-6">
          <div className="max-w-md text-center">
            <h1 className="font-heading text-3xl text-secondary mb-3">Something went wrong</h1>
            <p className="text-sm text-muted normal-case mb-2">
              A section of the page failed to render. Check the browser console for the full error.
            </p>
            <p className="text-xs text-primary normal-case font-mono mb-6 break-words">
              {String(this.state.error?.message ?? this.state.error)}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={this.handleReload} className="btn-primary">
                Reload Page
              </button>
              <a href="/Contect-us?subject=bug-report" className="btn-secondary">
                Report a Bug
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
