import { Link } from 'react-router-dom';
import { Home, Bug } from 'lucide-react';

export default function NotFound() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-accent bg-grid-light px-6">
      <div className="text-center max-w-md">
        <p className="font-heading text-8xl text-primary mb-4">404</p>
        <h1 className="text-2xl sm:text-3xl text-secondary mb-4">Oops! This page doesn&rsquo;t exist.</h1>
        <p className="text-muted text-sm normal-case leading-relaxed mb-8">
          The page you&rsquo;re looking for may have been moved or doesn&rsquo;t exist. Let&rsquo;s get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary min-w-[200px]">
            <Home size={16} /> Back to Home
          </Link>
          <Link to="/Contect-us?subject=bug-report" className="btn-secondary min-w-[200px]">
            <Bug size={16} /> Report a Bug
          </Link>
        </div>
      </div>
    </section>
  );
}
