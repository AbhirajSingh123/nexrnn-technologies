import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { NAV_LINKS, SITE } from '@/constants/siteData';
import useLockBodyScroll from '@/hooks/useLockBodyScroll';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useLockBodyScroll(mobileOpen);

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
          {NAV_LINKS.map((link) => (
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
              {NAV_LINKS.map((link) => (
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
            <div className="container-section pb-6">
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
    </header>
  );
}
