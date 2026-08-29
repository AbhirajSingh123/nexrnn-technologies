import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { FaInstagram, FaLinkedinIn, FaFacebookF, FaYoutube } from 'react-icons/fa';
import { SITE, SOCIAL_LINKS } from '@/constants/siteData';
import { SERVICES } from '@/data/services';
import { ACTIVE_COURSES } from '@/data/courses';

const FOOTER_SERVICES = SERVICES.filter((s) =>
  ['google-ads', 'meta-ads', 'social-media-marketing', 'google-business-profile', 'website-development', 'seo'].includes(s.slug)
);

export default function Footer() {
  return (
    <footer className="bg-secondary text-white pt-16 pb-8">
      <div className="container-section grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-9 h-9 bg-primary border-2 border-white flex items-center justify-center text-white text-sm font-heading shrink-0">
              N
            </span>
            <span className="font-heading text-lg leading-none">
              NexRNN <span className="text-primary">Technologies</span>
            </span>
          </div>
          <p className="text-sm text-white/60 normal-case leading-relaxed">
            Your digital growth &amp; technology partner — helping businesses market, build and grow, and helping
            individuals learn practical digital skills.
          </p>
          <div className="flex items-center gap-3 mt-5">
            <a href={SOCIAL_LINKS.instagram} aria-label="Instagram" className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center hover:bg-primary transition-colors">
              <FaInstagram size={15} />
            </a>
            <a href={SOCIAL_LINKS.linkedin} aria-label="LinkedIn" className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center hover:bg-primary transition-colors">
              <FaLinkedinIn size={15} />
            </a>
            <a href={SOCIAL_LINKS.facebook} aria-label="Facebook" className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center hover:bg-primary transition-colors">
              <FaFacebookF size={15} />
            </a>
            <a href={SOCIAL_LINKS.youtube} aria-label="YouTube" className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center hover:bg-primary transition-colors">
              <FaYoutube size={15} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest mb-4 text-white/50">Quick Links</h4>
          <ul className="space-y-2.5">
            <li><Link to="/" className="text-sm text-white/70 hover:text-primary transition-colors">Home</Link></li>
            <li><Link to="/services" className="text-sm text-white/70 hover:text-primary transition-colors">Services</Link></li>
            <li><Link to="/course" className="text-sm text-white/70 hover:text-primary transition-colors">Courses</Link></li>
            <li><Link to="/workshop" className="text-sm text-white/70 hover:text-primary transition-colors">Workshops</Link></li>
            <li><Link to="/blog" className="text-sm text-white/70 hover:text-primary transition-colors">Blog</Link></li>
            <li><Link to="/about-us" className="text-sm text-white/70 hover:text-primary transition-colors">About Us</Link></li>
            <li><Link to="/Contect-us" className="text-sm text-white/70 hover:text-primary transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest mb-4 text-white/50">Services</h4>
          <ul className="space-y-2.5">
            {FOOTER_SERVICES.map((s) => (
              <li key={s.slug}>
                <Link to="/services" className="text-sm text-white/70 hover:text-primary transition-colors">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest mb-4 text-white/50">Courses</h4>
          <ul className="space-y-2.5 mb-6">
            {ACTIVE_COURSES.map((c) => (
              <li key={c.slug}>
                <Link to={`/course/${c.slug}`} className="text-sm text-white/70 hover:text-primary transition-colors">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
          <div className="space-y-2.5">
            <a href={`mailto:${SITE.email}`} className="flex items-center gap-2.5 text-sm text-white/70 hover:text-primary transition-colors normal-case">
              <Mail size={14} className="shrink-0" /> {SITE.email}
            </a>
            <a href={`tel:${SITE.phone}`} className="flex items-center gap-2.5 text-sm text-white/70 hover:text-primary transition-colors">
              <Phone size={14} className="shrink-0" /> {SITE.phoneDisplay}
            </a>
            <p className="flex items-center gap-2.5 text-sm text-white/70 normal-case">
              <MapPin size={14} className="shrink-0" /> {SITE.address}
            </p>
          </div>
        </div>
      </div>

      <div className="container-section pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-white/50 normal-case">
          &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </p>
        <div className="flex items-center gap-5 text-xs text-white/50">
          <Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link to="/terms-and-conditions" className="hover:text-primary transition-colors">Terms &amp; Conditions</Link>
          <Link to="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link>
        </div>
      </div>
    </footer>
  );
}
