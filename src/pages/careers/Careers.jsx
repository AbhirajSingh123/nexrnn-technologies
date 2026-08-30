import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Briefcase, GraduationCap, MapPin, CalendarDays, ArrowRight, Search, Wallet,
} from 'lucide-react';
import { useCareers } from '@/hooks/useCareers';
import { isLastDatePassed } from '@/data/careersRepo';
import { SITE } from '@/constants/siteData';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Reveal from '@/components/shared/Reveal';

export default function Careers() {
  const [type, setType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { openings, loading } = useCareers(type, searchQuery);

  return (
    <>
      <Helmet>
        <title>Careers — Work with Us | {SITE.name}</title>
        <meta
          name="description"
          content={`Current job openings and internships at ${SITE.name}. Build your career in digital marketing and web development with real projects and mentorship.`}
        />
        <link rel="canonical" href={`${SITE.domain}/careers`} />
      </Helmet>

      {/* Hero Header */}
      <section className="bg-accent bg-grid-light pt-32 pb-14 border-b-2 border-secondary">
        <div className="container-section text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 badge-tag mb-4">
            <Briefcase size={14} className="text-primary" />
            <span>Careers at NexRNN</span>
          </div>
          <h1 className="text-secondary text-4xl sm:text-5xl md:text-6xl leading-[1.05] mb-5">
            Work with Us
          </h1>
          <p className="text-muted text-base sm:text-lg leading-relaxed normal-case">
            Real projects, honest mentorship and a team that grows together. Check our current
            openings below — jobs and internships.
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <section className="border-b-2 border-secondary/10 bg-white sticky top-[76px] z-30">
        <div className="container-section py-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            {[
              { key: 'all', label: 'All Openings' },
              { key: 'job', label: 'Jobs' },
              { key: 'internship', label: 'Internships' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`px-3.5 py-1.5 text-xs font-bold whitespace-nowrap border-2 transition-colors ${
                  type === t.key
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-secondary/20 text-muted hover:border-secondary/40'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative sm:w-64 shrink-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search openings…"
              className="w-full border-2 border-secondary/20 focus:border-primary pl-9 pr-3 py-2 text-sm outline-none transition-colors bg-white normal-case"
            />
          </div>
        </div>
      </section>

      {/* Openings */}
      <section className="py-14 sm:py-20 bg-accent min-h-[50vh]">
        <div className="container-section">
          {loading ? (
            <LoadingSpinner className="min-h-[40vh]" />
          ) : openings.length === 0 ? (
            <NoOpenings />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
              {openings.map((career, i) => (
                <CareerCard key={career.id || career.slug} career={career} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

/** Koi opening nahi - "not hiring" message */
function NoOpenings() {
  return (
    <div className="max-w-xl mx-auto text-center card-base bg-white p-10 sm:p-14">
      <div className="w-16 h-16 bg-accent border-2 border-secondary/15 mx-auto mb-5 flex items-center justify-center">
        <Briefcase size={28} className="text-muted" />
      </div>
      <h2 className="text-xl sm:text-2xl text-secondary normal-case mb-3">
        We are currently not hiring
      </h2>
      <p className="text-sm text-muted leading-relaxed normal-case mb-2">
        There are no open positions right now, but we are always happy to hear from motivated
        people.
      </p>
      <p className="text-sm text-muted leading-relaxed normal-case mb-6">
        Want more information or want to share your profile for future openings?{' '}
        <Link to="/Contect-us" className="text-primary font-bold hover:underline">
          Contact us
        </Link>
        .
      </p>
      <Link to="/Contect-us" className="btn-primary inline-flex items-center gap-2">
        Contact Us <ArrowRight size={15} />
      </Link>
    </div>
  );
}

function CareerCard({ career, index = 0 }) {
  const closed = isLastDatePassed(career.lastDateApply);

  return (
    <Reveal delay={(index % 3) * 0.08}>
      <Link
        to={`/careers/${career.slug}`}
        className="card-base card-hover h-full flex flex-col p-6 bg-white group"
      >
        {/* Type badge + fee */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 border ${
              career.type === 'internship'
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            {career.type === 'internship' ? <GraduationCap size={12} /> : <Briefcase size={12} />}
            {career.type === 'internship' ? 'Internship' : 'Job'}
          </span>
          <span
            className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 border ${
              career.feeType === 'paid'
                ? 'bg-orange-50 text-orange-700 border-orange-200'
                : 'bg-green-50 text-green-700 border-green-200'
            }`}
          >
            {career.feeType === 'paid' ? `Fee \u20b9${career.feeAmount}` : 'Free to Apply'}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-secondary normal-case leading-snug mb-2 group-hover:text-primary transition-colors">
          {career.title}
        </h3>

        {/* Meta */}
        <div className="space-y-1.5 text-xs text-muted mb-5 flex-1">
          {career.location && (
            <p className="flex items-center gap-1.5 normal-case">
              <MapPin size={13} className="text-primary shrink-0" /> {career.location}
            </p>
          )}
          {career.type === 'internship' && (career.duration || career.stipendType) && (
            <p className="flex items-center gap-1.5 normal-case flex-wrap">
              <Wallet size={13} className="text-primary shrink-0" />
              {career.duration ? `${career.duration}` : 'Internship'}
              {career.stipendType === 'paid' ? ` • ${career.stipendText || 'Paid'}` : ' • Unpaid'}
            </p>
          )}
          {career.lastDateApply && (
            <p className="flex items-center gap-1.5 normal-case">
              <CalendarDays size={13} className="text-primary shrink-0" />
              Last date to apply:{' '}
              <b className={closed ? 'text-primary' : 'text-secondary'}>
                {new Date(career.lastDateApply + 'T00:00:00').toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </b>
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-secondary/10 flex items-center justify-between gap-3 mt-auto">
          <span
            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 ${
              closed ? 'bg-red-50 text-primary border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            {closed ? 'Applications Closed' : 'Open'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">
            View More <ArrowRight size={13} />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}
