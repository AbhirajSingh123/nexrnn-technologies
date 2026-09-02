import { Component } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, LifeBuoy } from 'lucide-react';

/**
 * App-level ErrorBoundary.
 * - Error/File ka path user ko KABHI nahi dikhta (sirf friendly message)
 * - File/chunk load fail (naya deploy + purani khuli tab) -> ek baar AUTO-RELOAD,
 *   loop se bachne ke liye sessionStorage flag; phir bhi fail ho to friendly screen
 */
const CHUNK_FAIL_RE =
  /dynamically imported module|importing a module script|failed to fetch dynamically|loading chunk|chunkloaderror|loading css chunk|\/assets\/[\w.-]+\.(js|css)/i;
const RELOAD_FLAG = 'nx_chunk_reloaded';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, chunkFail: false };
  }

  static getDerivedStateFromError(error) {
    const msg = String(error?.message || error || '');
    return { error, chunkFail: CHUNK_FAIL_RE.test(msg) };
  }

  componentDidCatch(error, info) {
    // Developers ke liye console me poora error (user ki screen par kabhi nahi)
    console.error('App crashed:', error, info?.componentStack);
    const msg = String(error?.message || error || '');
    if (CHUNK_FAIL_RE.test(msg)) {
      try {
        if (!sessionStorage.getItem(RELOAD_FLAG)) {
          sessionStorage.setItem(RELOAD_FLAG, '1');
          window.location.reload();
          return;
        }
      } catch {
        /* ignore */
      }
    } else {
      try {
        sessionStorage.removeItem(RELOAD_FLAG);
      } catch {
        /* ignore */
      }
    }
  }

  handleReload = () => {
    try {
      sessionStorage.removeItem(RELOAD_FLAG);
    } catch {
      /* ignore */
    }
    this.setState({ error: null, chunkFail: false });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      const updating = this.state.chunkFail;
      return (
        <div className="min-h-screen flex items-center justify-center bg-accent bg-grid-light px-6">
          <div className="card-base bg-white max-w-md w-full text-center p-8 sm:p-10">
            <span className="inline-flex w-14 h-14 bg-primary/10 items-center justify-center mb-5">
              <RefreshCw size={24} className="text-primary" />
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl text-secondary mb-3 normal-case">
              {updating ? "We're making some updates" : 'Something went wrong'}
            </h1>
            <p className="text-sm text-muted normal-case leading-relaxed mb-8">
              {updating
                ? 'A new version of the website was just released. Please reload the page to continue — your work is safe.'
                : 'The page could not be displayed. Please try reloading — if the problem continues, let our team know.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={this.handleReload} className="btn-primary">
                <span className="inline-flex items-center gap-2">
                  <RefreshCw size={15} /> Reload Page
                </span>
              </button>
              <Link to="/Contect-us" className="btn-secondary">
                <span className="inline-flex items-center gap-2">
                  <LifeBuoy size={15} /> Contact Us
                </span>
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
