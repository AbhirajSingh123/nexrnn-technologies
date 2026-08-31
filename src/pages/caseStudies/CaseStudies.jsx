import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Briefcase, Sparkles, ArrowRight, Calendar, TrendingUp, Search } from 'lucide-react';
import { useCaseStudies } from '@/hooks/useCaseStudies';
import { formatBlogDate } from '@/utils/blogUtils';
import { SITE } from '@/constants/siteData';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Reveal from '@/components/shared/Reveal';

export default function CaseStudies() {
  const [industry, setIndustry] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { studies, loading } = useCaseStudies(industry, searchQuery);

  const industries = useMemo(() => {
    const set = new Set(studies.map((s) => s.industry).filter(Boolean));
    return ['all', ...[...set].sort()];
  }, [studies]);

  return (
    <>
      <Helmet>
        <title>Case Studies — Real Client Results | {SITE.name}</title>
        <meta
          name="description"
          content="Real digital marketing and web development case studies by NexRNN Technologies — see how we helped businesses 3x leads, grow sales and fill seats with practical strategies."
        />
        <link rel="canonical" href={`${SITE.domain}/case-studies`} />
      </Helmet>

      {/* Hero Header */}
      <section className="bg-accent bg-grid-light pt-32 pb-14 border-b-2 border-secondary">
        <div className="container-section text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 badge-tag mb-4">
            <Sparkles size={14} className="text-primary" />
            <span>NexRNN Case Studies</span>
          </div>
          <h1 className="text-secondary text-4xl sm:text-5xl md:text-6xl leading-[1.05] mb-5">
            Real Clients. Real Results.
          </h1>
          <p className="text-muted text-base sm:text-lg leading-relaxed normal-case">
            Deep dives into the strategies, execution and measurable outcomes of our client
            projects — no fluff, only what actually worked.
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <section className="border-b-2 border-secondary/10 bg-white sticky top-[76px] z-30">
        <div className="container-section py-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 flex-1">
            {industries.map((ind) => (
              <button
                key={ind}
                onClick={() => setIndustry(ind)}
                className={`px-3.5 py-1.5 text-xs font-bold whitespace-nowrap border-2 transition-colors ${
                  industry === ind
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-secondary/20 text-muted hover:border-secondary/40'
                }`}
              >
                {ind === 'all' ? 'All Industries' : ind}
              </button>
            ))}
          </div>
          <div className="relative sm:w-64 shrink-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search case studies…"
              className="w-full border-2 border-secondary/20 focus:border-primary pl-9 pr-3 py-2 text-sm outline-none transition-colors bg-white normal-case"
            />
          </div>
        </div>
      </section>

      {/* List */}
      <section className="py-14 sm:py-20 bg-accent min-h-[50vh]">
        <div className="container-section">
          {loading ? (
            <LoadingSpinner className="min-h-[40vh]" />
          ) : studies.length === 0 ? (
            <div className="text-center py-20">
              <Briefcase size={40} className="text-muted mx-auto mb-4" />
              <h3 className="text-xl text-secondary normal-case mb-2">No case studies found</h3>
              <p className="text-sm text-muted normal-case">
                Try a different industry or search term.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
              {studies.map((study, i) => (
                <CaseStudyCard key={study.id || study.slug} study={study} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-secondary py-14">
        <div className="container-section text-center max-w-2xl mx-auto">
          <h2 className="text-white text-2xl sm:text-3xl font-heading leading-tight mb-3">
            Want results like these for your business?
          </h2>
          <p className="text-white/70 text-sm sm:text-base normal-case mb-6">
            Tell us your goals — we&rsquo;ll build the strategy, execute it and report the numbers
            honestly.
          </p>
          <Link to="/Contect-us" className="btn-primary inline-flex items-center gap-2">
            Get Free Consultation <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}

function CaseStudyCard({ study, index = 0 }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(study.coverImageUrl) && !imgFailed;

  return (
    <Reveal delay={(index % 3) * 0.08}>
      <Link
        to={`/case-studies/${study.slug}`}
        className="card-base card-hover h-full flex flex-col overflow-hidden group bg-white"
      >
        {/* Cover */}
        <div className="block relative aspect-[16/9] bg-secondary overflow-hidden shrink-0 border-b-2 border-secondary">
          {showImage ? (
            <img
              src={study.coverImageUrl}
              alt={study.title}
              loading="lazy"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-secondary via-secondary to-[#15233c] text-white relative">
              <div className="absolute inset-0 bg-grid-light opacity-10 pointer-events-none" />
              <div className="w-12 h-12 bg-primary/20 border border-primary/40 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <TrendingUp size={22} className="text-primary" />
              </div>
              <span className="text-xs uppercase tracking-widest text-white/50 font-bold text-center">
                {study.clientName || 'NexRNN Client Story'}
              </span>
            </div>
          )}
          {study.industry && (
            <span className="absolute top-3 left-3 bg-secondary/90 backdrop-blur-xs text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 border border-white/20">
              {study.industry}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-center gap-4 text-xs text-muted mb-3">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} className="text-primary shrink-0" />
              {formatBlogDate(study.publishedAt)}
            </span>
            {study.clientName && (
              <span className="flex items-center gap-1.5 normal-case truncate">
                <Briefcase size={13} className="text-primary shrink-0" />
                {study.clientName}
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-secondary normal-case leading-snug mb-2 group-hover:text-primary transition-colors">
            {study.title}
          </h3>

          <p className="text-sm text-muted leading-relaxed normal-case mb-5 flex-1 line-clamp-3">
            {study.excerpt}
          </p>

          <div className="pt-4 border-t border-secondary/10 flex items-center justify-between gap-3 mt-auto">
            <div className="flex flex-wrap gap-1.5 min-w-0">
              {(study.tags || []).slice(0, 2).map((tag) => (
                <span key={tag} className="text-[10px] font-bold uppercase tracking-wide bg-accent text-secondary px-2 py-0.5">
                  {tag}
                </span>
              ))}
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform shrink-0">
              Read <ArrowRight size={13} />
            </span>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}
