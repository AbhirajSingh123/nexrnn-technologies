import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, Phone, MessageCircle } from 'lucide-react';
import { SITE } from '@/constants/siteData';
import { useMentorAuth } from '@/contexts/MentorAuthContext';

/** WhatsApp number (support) */
const WHATSAPP_NUM = '917520424645';

export default function MentorContact() {
  const { mentor } = useMentorAuth();
  const [message, setMessage] = useState('');

  // Mentor ki important details auto fetch (session profile se)
  const info = [
    'Mentor Support Request',
    '',
    `Name: ${mentor?.name || '-'}`,
    `Mentor ID: ${mentor?.mentorId || '-'}`,
    `Email: ${mentor?.email || '-'}`,
    `Phone: ${mentor?.phone || '-'}`,
    '',
    'Your message :-',
    message.trim() || '',
  ].join('\n');

  const mailto = `mailto:${SITE.email}?subject=${encodeURIComponent(`Mentor Support — ${mentor?.name || 'Mentor'} (${mentor?.mentorId || ''})`)}&body=${encodeURIComponent(info)}`;
  const whatsapp = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(info)}`;

  return (
    <div>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <h1 className="font-heading text-3xl text-secondary mb-1">Contact Us</h1>
      <p className="text-sm text-muted normal-case mb-6">Mentor support — NexRNN Technologies team.</p>

      {/* Mentor details auto-attach notice + message box */}
      <div className="card-base bg-white p-5 sm:p-6 max-w-2xl mb-8">
        <p className="text-xs text-muted normal-case mb-3">
          Your mentor details (name, mentor ID, email, phone) are attached automatically —
          just write your problem below and send via Email or WhatsApp.
        </p>
        <label className="block text-xs font-bold text-secondary uppercase tracking-wide mb-1.5">Your Message</label>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your problem here…"
          className="w-full border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white normal-case resize-y"
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-5 max-w-3xl">
        <a
          href={mailto}
          className="card-base bg-white p-7 border-2 border-transparent hover:border-primary transition-colors"
        >
          <span className="w-11 h-11 bg-primary/10 flex items-center justify-center mb-4">
            <Mail size={19} className="text-primary" />
          </span>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Email</p>
          <p className="text-sm font-bold text-secondary break-all normal-case">{SITE.email}</p>
          <p className="text-[11px] text-muted normal-case mt-2">Opens your mail app with details attached</p>
        </a>

        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="card-base bg-white p-7 border-2 border-transparent hover:border-primary transition-colors"
        >
          <span className="w-11 h-11 bg-primary/10 flex items-center justify-center mb-4">
            <MessageCircle size={19} className="text-primary" />
          </span>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">WhatsApp Us</p>
          <p className="text-sm font-bold text-secondary">+91 75204 24645</p>
          <p className="text-[11px] text-muted normal-case mt-2">Opens WhatsApp with details attached</p>
        </a>

        <a
          href={`tel:${SITE.phone.replace(/\s/g, '')}`}
          className="card-base bg-white p-7 border-2 border-transparent hover:border-primary transition-colors"
        >
          <span className="w-11 h-11 bg-primary/10 flex items-center justify-center mb-4">
            <Phone size={19} className="text-primary" />
          </span>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Phone</p>
          <p className="text-sm font-bold text-secondary">{SITE.phone}</p>
          <p className="text-[11px] text-muted normal-case mt-2">Click to call</p>
        </a>
      </div>
    </div>
  );
}
