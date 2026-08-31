import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Search, X, Loader2, Briefcase, GraduationCap, CalendarDays, BookOpen, ArrowRight } from 'lucide-react';
import { fetchServices } from '@/data/servicesRepo';
import { fetchCourses } from '@/data/coursesRepo';
import { fetchWorkshops } from '@/data/workshopsRepo';
import { fetchBlogPosts } from '@/data/blogRepo';

/**
 * WEBSITE SEARCH - Services, Courses, Workshops sab ek jagah.
 * Navbar ke search icon se khulta hai. Live results ke saath.
 */
export default function SearchOverlay({ onClose }) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState({ services: [], courses: [], workshops: [], blogs: [] });
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Fetch all catalog data once when overlay opens
  useEffect(() => {
    inputRef.current?.focus();
    Promise.allSettled([fetchServices(), fetchCourses(), fetchWorkshops(), fetchBlogPosts({})]).then(([s, c, w, b]) => {
      setItems({
        services: s.status === 'fulfilled' ? s.value : [],
        courses: c.status === 'fulfilled' ? c.value : [],
        workshops: w.status === 'fulfilled' ? w.value : [],
        blogs: b.status === 'fulfilled' ? b.value : [],
      });
      setLoading(false);
    });
  }, []);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (q.length < 2) return { services: [], courses: [], workshops: [], blogs: [] };
    const match = (item) =>
      [item.title, item.tagline, item.short_description, item.shortDescription, item.mode, item.level, item.excerpt, item.categoryName]
        .some((v) => typeof v === 'string' && v.toLowerCase().includes(q));
    return {
      services: items.services.filter(match).slice(0, 5),
      courses: items.courses.filter(match).slice(0, 5),
      workshops: items.workshops.filter(match).slice(0, 5),
      blogs: items.blogs.filter(match).slice(0, 5),
    };
  }, [q, items]);

  const totalResults = results.services.length + results.courses.length + results.workshops.length + results.blogs.length;

  const go = (path) => {
    onClose();
    navigate(path);
  };

  const renderGroup = (label, Icon, rows, pathBase, getName) => {
    if (rows.length === 0) return null;
    return (
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2 flex items-center gap-1.5">
          <Icon size={12} /> {label}
        </p>
        <div className="space-y-1">
          {rows.map((item) => (
            <button
              key={item.slug}
              onClick={() => go(`${pathBase}/${item.slug}`)}
              className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors flex items-center justify-between gap-3 border border-transparent hover:border-secondary/10"
            >
              <span className="text-sm font-semibold text-secondary normal-case truncate">{getName(item)}</span>
              <ArrowRight size={14} className="text-primary shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-secondary/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-w-xl mx-auto mt-24 card-base bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b-2 border-secondary/15 px-5 py-4">
          {loading ? (
            <Loader2 size={18} className="text-muted animate-spin shrink-0" />
          ) : (
            <Search size={18} className="text-muted shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services, courses, workshops & blogs…"
            className="flex-1 text-base outline-none bg-transparent text-secondary placeholder:text-muted/60 normal-case"
          />
          <button onClick={onClose} className="text-muted hover:text-secondary transition-colors" title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {q.length < 2 ? null : loading ? (
            <p className="text-sm text-muted normal-case text-center py-6">Loading…</p>
          ) : totalResults === 0 ? (
            <p className="text-sm text-muted normal-case text-center py-6">
              No results found for "{query}". Check the spelling or try different keywords.
            </p>
          ) : (
            <>
              {renderGroup('Services', Briefcase, results.services, '/services', (i) => i.title)}
              {renderGroup('Courses', GraduationCap, results.courses, '/course', (i) => i.title)}
              {renderGroup('Workshops', CalendarDays, results.workshops, '/workshop', (i) => i.title)}
              {renderGroup('Blogs', BookOpen, results.blogs, '/blog', (i) => i.title)}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
