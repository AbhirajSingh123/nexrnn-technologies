import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search } from 'lucide-react';
import SearchOverlay from '@/components/shared/SearchOverlay';
import { NAV_LINKS } from '@/constants/siteData';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import useLockBodyScroll from '@/hooks/useLockBodyScroll';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  const visibleLinks = NAV_LINKS.filter((link) => !link.settingsKey || settings[link.settingsKey]);

  useLockBodyScroll(mobileOpen);
  useLockBodyScroll(mobileOpen);

  // Ctrl+K / '/' se search khulo
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName))) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isHomeActive = (path) => path === '/';

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 bg-white border-b-2 border-secondary transition-shadow duration-200 ${
        scrolled ? 'shadow-[0_4px_0_0_rgba(11,18,32,0.06)]' : ''
      }`}
    >
      {/* Announcement bar (Site Settings se control hota hai) */}
      {settings.announcementEnabled && (settings.announcementText || settings.announcementButtonText) && (
        <div className="bg-secondary text-white">
          <div className="container-section flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center">
            {settings.announcementText && (
              <p className="text-[11px] sm:text-xs font-medium tracking-wide">
                {settings.announcementText}
              </p>
            )}
            {settings.announcementButtonText && (
              <AnnouncementLink href={settings.announcementButtonLink}>
                {settings.announcementButtonText}
              </AnnouncementLink>
            )}
          </div>
        </div>
      )}

      <nav className="container-section flex items-center justify-between h-[76px]" aria-label="Primary">
        <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
          <span className="w-9 h-9 bg-primary border-2 border-secondary flex items-center justify-center text-white text-sm font-heading shrink-0">
            N
          </span>
          <span className="font-heading text-lg sm:text-xl tracking-wide leading-none">
            <span className="text-secondary">NexRNN</span> <span className="text-primary">Technologies</span>
          </span>
        </Link>

        <ul className="hidden lg:flex items-center gap-8">
          {visibleLinks.map((link) => (
            <li key={link.href}>
              <NavLink
                to={link.href}
                end={isHomeActive(link.href)}
                className={({ isActive }) =>
                  `relative text-sm font-semibold tracking-wide transition-colors duration-200 py-2 ${
                    isActive ? 'text-primary' : 'text-secondary/80 hover:text-primary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute left-0 -bottom-0.5 h-[2px] w-full bg-primary"
                      />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden lg:block">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-9 h-9 flex items-center justify-center border-2 border-secondary/20 hover:border-primary hover:text-primary text-secondary transition-colors mr-3"
            title="Search (Ctrl+K)"
            aria-label="Search"
          >
            <Search size={16} />
          </button>
        </div>
        <div className="hidden lg:block">
          <button onClick={() => navigate('/Contect-us')} className="btn-primary">
            Get Started
          </button>
        </div>

        <button
          className="lg:hidden relative w-10 h-10 flex items-center justify-center text-secondary"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="lg:hidden bg-white border-t-2 border-secondary overflow-hidden"
          >
            <ul className="container-section py-6 flex flex-col gap-1">
              {visibleLinks.map((link) => (
                <li key={link.href}>
                  <NavLink
                    to={link.href}
                    end={isHomeActive(link.href)}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `block py-3 text-base font-semibold border-b border-secondary/10 ${
                        isActive ? 'text-primary' : 'text-secondary'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="container-section pb-6 space-y-2">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setSearchOpen(true);
                }}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <Search size={15} /> Search Services, Courses, Workshops
              </button>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  navigate('/Contect-us');
                }}
                className="btn-primary w-full"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Website Search */}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </header>
  );
}

// Announcement button: internal link same tab me (react-router), external naye tab me
function AnnouncementLink({ href, children }) {
  const pillClass =
    'inline-flex items-center border-2 border-white/70 bg-primary px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-primary/85';
  if (!href) {
    return <span className={pillClass}>{children}</span>;
  }
  const external = href.startsWith('http://') || href.startsWith('https://');
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={pillClass}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={pillClass}>
      {children}
    </Link>
  );
}
