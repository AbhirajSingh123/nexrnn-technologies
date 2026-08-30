import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react';
import { formatBlogDate } from '@/utils/blogUtils';
import Reveal from '@/components/shared/Reveal';

export default function BlogCard({ post, index = 0 }) {
  // Agar cover image ka URL broken/private hai to branded fallback dikhe
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(post.coverImageUrl) && !imgFailed;

  return (
    <Reveal delay={(index % 3) * 0.08}>
      <motion.article
        whileHover={{ y: -4 }}
        className="card-base card-hover h-full flex flex-col overflow-hidden group bg-white"
      >
        {/* Cover image or Branded Header */}
        <Link
          to={`/blog/${post.slug}`}
          className="block relative aspect-[16/9] bg-secondary overflow-hidden shrink-0 border-b-2 border-secondary"
        >
          {showImage ? (
            <img
              src={post.coverImageUrl}
              alt={post.title}
              loading="lazy"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-secondary via-secondary to-[#15233c] text-white relative">
              <div className="absolute inset-0 bg-grid-light opacity-10 pointer-events-none" />
              <div className="w-12 h-12 bg-primary/20 border border-primary/40 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <BookOpen size={22} className="text-primary" />
              </div>
              <span className="text-xs uppercase tracking-widest text-white/50 font-bold">
                {post.categoryName || 'NexRNN Article'}
              </span>
            </div>
          )}
          <span className="absolute top-3 left-3 bg-secondary/90 backdrop-blur-xs text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 border border-white/20">
            {post.categoryName || post.categorySlug}
          </span>
        </Link>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted mb-3">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} className="text-primary shrink-0" />
              {formatBlogDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-primary shrink-0" />
              {post.readingTime}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-secondary normal-case leading-snug mb-2 group-hover:text-primary transition-colors">
            <Link to={`/blog/${post.slug}`}>{post.title}</Link>
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-muted leading-relaxed normal-case mb-5 flex-1 line-clamp-3">
            {post.excerpt}
          </p>

          {/* Footer: Author & Link */}
          <div className="pt-4 border-t border-secondary/10 flex items-center justify-between gap-3 mt-auto">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0">
                {post.authorName ? post.authorName.charAt(0) : 'N'}
              </div>
              <div className="truncate text-xs">
                <p className="font-semibold text-secondary truncate">{post.authorName}</p>
              </div>
            </div>

            <Link
              to={`/blog/${post.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform"
            >
              Read <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </motion.article>
    </Reveal>
  );
}
