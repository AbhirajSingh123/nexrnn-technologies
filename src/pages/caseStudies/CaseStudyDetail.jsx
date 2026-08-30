import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Calendar, Briefcase, TrendingUp, Tag, Phone, Eye,
} from 'lucide-react';
import { useCaseStudy } from '@/hooks/useCaseStudies';
import { incrementCaseStudyViews } from '@/data/caseStudiesRepo';
import { formatBlogDate } from '@/utils/blogUtils';
import { SITE } from '@/constants/siteData';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import MarkdownContent from '@/components/shared/MarkdownContent';

export default function CaseStudyDetail() {
  const { slug } = useParams();
  const { study, loading } = useCaseStudy(slug);

  // Views counter - ek session me ek baar (blog jaisa hi)
  useEffect(() => {
    if (!slug) return;
    try {
      if (!sessionStorage.getItem(`cs_viewed_${slug}`)) {
        sessionStorage.setItem(`cs_viewed_${slug}`, '1');
        incrementCaseStudyViews(slug);
      }
    } catch {
      /* ignore */
    }
  }, [slug]);

  if (loading) return <LoadingSpinner className="min-h-[60vh]" />;

  if (!study) {
    return (
      <div className="pt-40 pb-24 text-center px-4">
        <TrendingUp size={42} className="text-muted mx-auto mb-4" />
        <h1 className="text-2xl text-secondary normal-case mb-3">Case study not found</h1>
        <p className="text-sm text-muted normal-case mb-6">
          It may have been unpublished or the link is incorrect.
        </p>
        <Link to="/case-studies" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft size={15} /> All Case Studies
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{study.title} | Case Study | {SITE.name}</title>
        <meta name="description" content={study.excerpt} />
        <link rel="canonical" href={`${SITE.domain}/case-studies/${study.slug}`} />
      </Helmet>

      {/* Hero */}
      <section className="bg-accent bg-grid-light pt-32 pb-12 border-b-2 border-secondary">
        <div className="container-section max-w-3xl mx-auto">
          <Link
            to="/case-studies"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline mb-5"
          >
            <ArrowLeft size={13} /> All Case Studies
          </Link>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {study.industry && (
              <span className="badge-tag">
                <Briefcase size={13} className="text-primary" />
                <span>{study.industry}</span>
              </span>
            )}
            {study.caseCode && (
              <span className="text-[10px] font-mono font-bold text-muted border-2 border-secondary/15 px-2 py-1">
                {study.caseCode}
              </span>
            )}
          </div>
          <h1 className="text-secondary text-3xl sm:text-4xl md:text-5xl leading-[1.08] mb-5 normal-case">
            {study.title}
          </h1>
          <p className="text-muted text-base leading-relaxed normal-case mb-6">{study.excerpt}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} className="text-primary shrink-0" />
              {formatBlogDate(study.publishedAt)}
            </span>
            {study.clientName && (
              <span className="flex items-center gap-1.5 normal-case">
                <Briefcase size={13} className="text-primary shrink-0" />
                Client: <b className="text-secondary">{study.clientName}</b>
              </span>
            )}
            <span className="flex items-center gap-1.5 normal-case">
              <Eye size={13} className="text-primary shrink-0" />
              {study.views ?? 0} views
            </span>
          </div>
        </div>
      </section>

      {/* Cover image */}
      {study.coverImageUrl && (
        <section className="container-section max-w-4xl mx-auto -mb-2 mt-10">
          <img
            src={study.coverImageUrl}
            alt={study.title}
            className="w-full border-2 border-secondary object-cover"
          />
        </section>
      )}

      {/* Content */}
      <section className="py-12 sm:py-16">
        <div className="container-section max-w-3xl mx-auto">
          <MarkdownContent content={study.content} className="space-y-3" />

          {/* Tags */}
          {(study.tags || []).length > 0 && (
            <div className="flex items-center flex-wrap gap-2 mt-10 pt-6 border-t-2 border-secondary/10">
              <Tag size={15} className="text-primary" />
              {study.tags.map((tag) => (
                <span key={tag} className="text-xs font-bold uppercase tracking-wide bg-accent text-secondary px-2.5 py-1 border border-secondary/15">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-secondary py-14">
        <div className="container-section text-center max-w-2xl mx-auto">
          <h2 className="text-white text-2xl sm:text-3xl font-heading leading-tight mb-3">
            Ready to write your own success story?
          </h2>
          <p className="text-white/70 text-sm sm:text-base normal-case mb-6">
            Book a free consultation — we&rsquo;ll audit your current marketing and show you
            exactly what we&rsquo;d do differently.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/Contect-us" className="btn-primary inline-flex items-center gap-2">
              Get Free Consultation <ArrowRight size={16} />
            </Link>
            <a
              href={`tel:${SITE.phone}`}
              className="inline-flex items-center gap-2 border-2 border-white/30 text-white px-6 py-2.5 text-sm font-bold hover:border-primary hover:text-primary transition-colors"
            >
              <Phone size={15} /> {SITE.phoneDisplay}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

