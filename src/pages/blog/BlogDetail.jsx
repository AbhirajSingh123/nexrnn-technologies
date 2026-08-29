import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  MousePointerClick,
  ImageOff,
} from 'lucide-react';
import { FaWhatsapp, FaLinkedinIn, FaXTwitter } from 'react-icons/fa6';
import { useBlogPost } from '@/hooks/useBlog';
import { formatBlogDate } from '@/utils/blogUtils';
import { SITE } from '@/constants/siteData';
import { DEFAULT_AUTHOR_BIO } from '@/data/blog';
import { BLOG_AD_SLOTS } from '@/constants/adsConfig';
import GoogleAd from '@/components/blog/GoogleAd';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

/**
 * Simple, robust content renderer for article markdown text
 */
function MarkdownRenderer({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-4 space-y-2 list-disc list-inside text-secondary/80">
          {currentList.map((item, idx) => (
            <li key={idx} className="leading-relaxed pl-1">
              <span className="font-normal text-secondary">{formatInlineText(item)}</span>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const formatInlineText = (text) => {
    // Handle **bold** and *italic*
    const parts = [];
    const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(<strong key={match.index} className="font-bold text-secondary">{token.slice(2, -2)}</strong>);
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(<em key={match.index} className="italic">{token.slice(1, -1)}</em>);
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts.length > 0 ? parts : text;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentList.push(trimmed.substring(2));
      return;
    } else {
      flushList();
    }

    if (!trimmed) {
      return;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={index} className="text-xl sm:text-2xl font-heading text-secondary mt-8 mb-3">
          {trimmed.substring(4)}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={index} className="text-2xl sm:text-3xl font-heading text-secondary mt-10 mb-4 pb-2 border-b border-secondary/10">
          {trimmed.substring(3)}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={index} className="text-3xl sm:text-4xl font-heading text-secondary mt-10 mb-4">
          {trimmed.substring(2)}
        </h1>
      );
    } else if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={index} className="my-6 border-l-4 border-primary bg-primary/5 p-4 italic text-secondary/90">
          {formatInlineText(trimmed.substring(2))}
        </blockquote>
      );
    } else {
      elements.push(
        <p key={index} className="my-4 text-base sm:text-lg leading-relaxed text-secondary/85 normal-case font-normal">
          {formatInlineText(trimmed)}
        </p>
      );
    }
  });

  flushList();
  return <div className="article-body">{elements}</div>;
}

export default function BlogDetail() {
  const { slug } = useParams();
  const { post, nextPost, prevPost, loading, error } = useBlogPost(slug);
  const [copied, setCopied] = useState(false);
  const [coverImgError, setCoverImgError] = useState(false);

  // Post badalne par image error state reset karo
  useEffect(() => {
    setCoverImgError(false);
  }, [slug]);

  if (loading) {
    return <LoadingSpinner className="min-h-[70vh]" />;
  }

  if (error || !post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-20">
        <BookOpen size={48} className="text-muted mb-4" />
        <h1 className="text-3xl text-secondary mb-3">Article Not Found</h1>
        <p className="text-muted normal-case mb-6 max-w-md">
          The article you are looking for doesn&rsquo;t exist or may have been moved.
        </p>
        <Link to="/blog" className="btn-primary">
          Back to Blog
        </Link>
      </div>
    );
  }

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `${SITE.domain}/blog/${post.slug}`;
  const shareTitle = encodeURIComponent(post.title);
  const shareUrl = encodeURIComponent(currentUrl);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success('Article link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy link.');
    }
  };

  return (
    <>
      <Helmet>
        <title>{post.title} | {SITE.name}</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={`${SITE.domain}/blog/${post.slug}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${SITE.domain}/blog/${post.slug}`} />
        {post.coverImageUrl && <meta property="og:image" content={post.coverImageUrl} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            url: `${SITE.domain}/blog/${post.slug}`,
            datePublished: post.publishedAt,
            dateModified: post.updatedAt || post.publishedAt,
            author: {
              '@type': 'Person',
              name: post.authorName,
              jobTitle: post.authorRole,
            },
            publisher: {
              '@type': 'Organization',
              name: SITE.name,
              url: SITE.domain,
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `${SITE.domain}/blog/${post.slug}`,
            },
          })}
        </script>
      </Helmet>

      {/* Article Header & Navigation */}
      <article className="bg-[#F9FAFC] pt-28 pb-16 border-b-2 border-secondary">
        <div className="container-section max-w-4xl mx-auto">
          {/* Back to Blog */}
          <div className="mb-6">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary/70 hover:text-primary transition-colors"
            >
              <ArrowLeft size={14} /> Back to All Articles
            </Link>
          </div>

          {/* Category & Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted mb-4">
            <span className="bg-primary text-white font-bold uppercase px-3 py-1 text-[11px] border border-secondary shadow-[2px_2px_0_#0B1220]">
              {post.categoryName}
            </span>
            <span className="flex items-center gap-1.5 font-medium text-secondary/70">
              <Calendar size={14} className="text-primary" />
              {formatBlogDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5 font-medium text-secondary/70">
              <Clock size={14} className="text-primary" />
              {post.readingTime}
            </span>
          </div>

          {/* Article Title */}
          <h1 className="text-secondary text-3xl sm:text-4xl md:text-5xl leading-[1.12] mb-6 normal-case font-heading">
            {post.title}
          </h1>

          {/* Excerpt / Lead */}
          <p className="text-muted text-base sm:text-xl leading-relaxed normal-case mb-8 font-normal">
            {post.excerpt}
          </p>

          {/* Author Strip & Share */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y-2 border-secondary/15">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-primary text-white font-bold text-base flex items-center justify-center border-2 border-secondary shadow-[2px_2px_0_#0B1220]">
                {post.authorName ? post.authorName.charAt(0) : 'N'}
              </div>
              <div>
                <p className="text-sm font-bold text-secondary">{post.authorName}</p>
                <p className="text-xs text-muted normal-case">{post.authorRole}</p>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2 text-xs font-bold text-secondary">
              <span className="flex items-center gap-1.5 text-muted mr-1">
                <Share2 size={14} /> Share:
              </span>
              <a
                href={`https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded bg-white border border-secondary flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors"
                aria-label="Share on WhatsApp"
              >
                <FaWhatsapp size={15} />
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded bg-white border border-secondary flex items-center justify-center hover:bg-[#0077B5] hover:text-white transition-colors"
                aria-label="Share on LinkedIn"
              >
                <FaLinkedinIn size={14} />
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded bg-white border border-secondary flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                aria-label="Share on X"
              >
                <FaXTwitter size={13} />
              </a>
              <button
                onClick={copyToClipboard}
                className="w-8 h-8 rounded bg-white border border-secondary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                aria-label="Copy link"
                title="Copy link"
              >
                {copied ? <Check size={14} className="text-green-600" /> : <span className="text-[10px]">URL</span>}
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Main Article Content Container */}
      <div className="bg-white py-12">
        <div className="container-section max-w-3xl mx-auto">
          {/* Featured Cover Image if exists */}
          {post.coverImageUrl && !coverImgError && (
            <div className="card-base mb-10 overflow-hidden">
              <img
                src={post.coverImageUrl}
                alt={post.title}
                onError={() => setCoverImgError(true)}
                className="w-full h-auto object-cover max-h-[460px]"
              />
            </div>
          )}

          {post.coverImageUrl && coverImgError && (
            <div className="card-base mb-10 p-4 flex items-center gap-3 bg-accent border-2 border-dashed border-secondary/30">
              <ImageOff size={18} className="text-muted shrink-0" />
              <p className="text-xs text-muted normal-case leading-relaxed">
                Cover image abhi load nahi ho paayi (link broken ya private ho sakta hai).
                Article baaki content theek chal raha hai.
              </p>
            </div>
          )}

          {/* Google Ad: article top (cover image ke baad) */}
          <GoogleAd slot={BLOG_AD_SLOTS.blogDetailTop} />

          {/* Article Body */}
          <div className="prose prose-lg max-w-none text-secondary">
            <MarkdownRenderer content={post.content} />
          </div>

          {/* CTA Button (admin panel se set kiya hua link) */}
          {/* Admin har blog mein redirect link add kar sakta hai jo padhne ke baad dikhe */}
          {post.ctaUrl && (
            <div className="card-base mt-10 p-6 sm:p-8 bg-secondary text-white border-b-4 border-primary">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-primary">
                <MousePointerClick size={13} /> Next Step
              </span>
              <h3 className="text-lg sm:text-xl font-heading text-white mt-2 mb-4 normal-case">
                Ye article helpful laga? Ab aage badho &mdash;
              </h3>
              {post.ctaUrl.startsWith('/') ? (
                <Link
                  to={post.ctaUrl}
                  className="btn-primary !py-3 !px-6 inline-flex items-center gap-2"
                >
                  {post.ctaText || 'Learn More'} <ArrowRight size={15} />
                </Link>
              ) : (
                <a
                  href={post.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary !py-3 !px-6 inline-flex items-center gap-2"
                >
                  {post.ctaText || 'Learn More'} <ArrowRight size={15} />
                </a>
              )}
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t-2 border-secondary/10">
              <span className="text-xs font-bold uppercase tracking-wider text-muted block mb-3">
                Related Topics
              </span>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block bg-accent text-secondary text-xs font-semibold px-3 py-1.5 border border-secondary/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Google Ad: article bottom (content ke baad, author card se pehle) */}
          <GoogleAd slot={BLOG_AD_SLOTS.blogDetailBottom} />

          {/* Author Card Box */}
          <div className="card-base bg-accent p-6 sm:p-8 mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-14 h-14 bg-primary text-white font-heading text-2xl flex items-center justify-center shrink-0 border-2 border-secondary shadow-[3px_3px_0_#0B1220]">
              {post.authorName ? post.authorName.charAt(0) : 'N'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">About the Author</span>
              </div>
              <h3 className="text-lg font-bold text-secondary normal-case leading-tight">
                {post.authorName}
              </h3>
              <p className="text-xs font-semibold text-muted mb-2 normal-case">{post.authorRole}</p>
              <p className="text-xs sm:text-sm text-secondary/80 normal-case leading-relaxed">
                {/* Admin panel se edit kiya hua bio (khali ho to default) */}
                {post.authorBio || DEFAULT_AUTHOR_BIO}
              </p>
            </div>
          </div>

          {/* Next / Previous Chronological Blog Navigation */}
          {/* As requested: "Sabhi categories mile ke overall chronological order mein next blog dikhaye" */}
          <div className="mt-14 pt-8 border-t-2 border-secondary">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-muted">
                Continue Reading
              </span>
              <Link to="/blog" className="text-xs font-bold text-primary hover:underline">
                View All Articles &rarr;
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Previous Article */}
              {prevPost && (
                <Link
                  to={`/blog/${prevPost.slug}`}
                  className="card-base card-hover p-5 flex flex-col justify-between group bg-white"
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-primary font-bold uppercase tracking-wider mb-2">
                      <ChevronLeft size={14} /> Previous Article
                    </div>
                    <p className="text-xs text-muted mb-1 font-semibold uppercase">{prevPost.categoryName}</p>
                    <h4 className="text-sm sm:text-base font-bold text-secondary normal-case line-clamp-2 group-hover:text-primary transition-colors">
                      {prevPost.title}
                    </h4>
                  </div>
                  <span className="text-[11px] text-muted mt-3 block">
                    {formatBlogDate(prevPost.publishedAt)} &bull; {prevPost.readingTime}
                  </span>
                </Link>
              )}

              {/* Next Article (Overall Chronological Order across all categories) */}
              {nextPost && (
                <Link
                  to={`/blog/${nextPost.slug}`}
                  className="card-base card-hover p-5 flex flex-col justify-between group bg-white border-l-4 border-l-primary"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5 text-xs text-primary font-bold uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1">
                        <Sparkles size={13} /> Next Article
                      </span>
                      <ChevronRight size={14} />
                    </div>
                    <p className="text-xs text-muted mb-1 font-semibold uppercase">{nextPost.categoryName}</p>
                    <h4 className="text-sm sm:text-base font-bold text-secondary normal-case line-clamp-2 group-hover:text-primary transition-colors">
                      {nextPost.title}
                    </h4>
                  </div>
                  <span className="text-[11px] text-muted mt-3 block">
                    {formatBlogDate(nextPost.publishedAt)} &bull; {nextPost.readingTime}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <section className="bg-secondary text-white py-14 border-t-2 border-secondary">
        <div className="container-section max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl text-white mb-3">
            Ready to Put These Strategies Into Action?
          </h2>
          <p className="text-white/70 text-sm sm:text-base normal-case mb-6">
            Get in touch with NexRNN Technologies for a complimentary digital growth consultation.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/Contect-us" className="btn-primary !py-3">
              Book Free Consultation
            </Link>
            <Link to="/services" className="btn-outline-light !py-3">
              View Our Services
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
