import { useState, useMemo, Fragment } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, ArrowRight, Calendar, Clock } from 'lucide-react';
import { useBlogCategories, useBlogPosts } from '@/hooks/useBlog';
import { formatBlogDate } from '@/utils/blogUtils';
import { SITE } from '@/constants/siteData';
import { BLOG_AD_SLOTS } from '@/constants/adsConfig';
import BlogCard from '@/components/blog/BlogCard';
import BlogFilterBar from '@/components/blog/BlogFilterBar';
import GoogleAd from '@/components/blog/GoogleAd';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Reveal from '@/components/shared/Reveal';

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { categories, loading: categoriesLoading } = useBlogCategories();
  const { posts, loading: postsLoading } = useBlogPosts(selectedCategory, searchQuery);

  const featuredPost = useMemo(() => {
    // When viewing all and no active search query, showcase the latest post
    if (selectedCategory === 'all' && !searchQuery.trim() && posts.length > 0) {
      return posts[0];
    }
    return null;
  }, [posts, selectedCategory, searchQuery]);

  const remainingPosts = useMemo(() => {
    if (featuredPost) {
      return posts.slice(1);
    }
    return posts;
  }, [posts, featuredPost]);

  const loading = categoriesLoading || postsLoading;

  return (
    <>
      <Helmet>
        <title>Insights, Tech & Marketing Blog | {SITE.name}</title>
        <meta
          name="description"
          content="Practical guides, strategies, and case studies on Digital Marketing, Google Ads, Meta Ads, Web Development, SEO, and AI Automation by NexRNN Technologies Lucknow."
        />
        <link rel="canonical" href={`${SITE.domain}/blog`} />
      </Helmet>

      {/* Hero Header */}
      <section className="bg-accent bg-grid-light pt-32 pb-14 border-b-2 border-secondary">
        <div className="container-section text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 badge-tag mb-4">
            <Sparkles size={14} className="text-primary" />
            <span>NexRNN Insights &amp; Articles</span>
          </div>
          <h1 className="text-secondary text-4xl sm:text-5xl md:text-6xl leading-[1.05] mb-5">
            Knowledge for Modern Digital Growth
          </h1>
          <p className="text-muted text-base sm:text-lg leading-relaxed normal-case">
            Actionable strategies, expert analyses, and practical tutorials on marketing,
            modern web development, and AI tools from our team in Lucknow.
          </p>

        </div>
      </section>

      {/* Main Blog Section */}
      <section className="section-padding bg-[#F9FAFC]">
        <div className="container-section">
          {/* Filters & Search */}
          <BlogFilterBar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {loading ? (
            <LoadingSpinner />
          ) : posts.length === 0 ? (
            <div className="card-base bg-white max-w-md mx-auto p-8 text-center my-10">
              <BookOpen size={36} className="text-muted mx-auto mb-3" />
              <h2 className="text-xl text-secondary mb-2">No Articles Found</h2>
              <p className="text-sm text-muted normal-case mb-6">
                We couldn&rsquo;t find any articles matching your search. Try resetting your
                filters or search terms.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="btn-primary"
              >
                Show All Articles
              </button>
            </div>
          ) : (
            <>
              {/* Featured Post Card (Hero Highlight) */}
              {featuredPost && (
                <Reveal>
                  <div className="card-base card-hover mb-12 overflow-hidden bg-white">
                    <div className="grid lg:grid-cols-12 gap-0">
                      {/* Featured Image/Visual */}
                      <Link
                        to={`/blog/${featuredPost.slug}`}
                        className="lg:col-span-7 block relative bg-secondary min-h-[260px] lg:min-h-[380px] overflow-hidden group border-b-2 lg:border-b-0 lg:border-r-2 border-secondary"
                      >
                        {featuredPost.coverImageUrl ? (
                          <img
                            src={featuredPost.coverImageUrl}
                            alt={featuredPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-secondary via-secondary to-[#15233c] text-white">
                            <div className="w-16 h-16 bg-primary/20 border border-primary/40 rounded-full flex items-center justify-center mb-4">
                              <BookOpen size={32} className="text-primary" />
                            </div>
                            <span className="text-xs uppercase tracking-widest text-white/60 font-bold">
                              Featured Read &bull; {featuredPost.categoryName}
                            </span>
                          </div>
                        )}
                        <span className="absolute top-4 left-4 bg-primary text-white text-xs font-bold uppercase tracking-wider px-3 py-1 border border-secondary shadow-[2px_2px_0_#0B1220]">
                          Featured Story
                        </span>
                      </Link>

                      {/* Featured Body */}
                      <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted mb-3">
                            <span className="bg-secondary/5 font-semibold text-secondary uppercase px-2.5 py-1 text-[11px] border border-secondary/15">
                              {featuredPost.categoryName}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-primary" />
                              {formatBlogDate(featuredPost.publishedAt)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock size={13} className="text-primary" />
                              {featuredPost.readingTime}
                            </span>
                          </div>

                          <h2 className="text-2xl sm:text-3xl text-secondary normal-case leading-snug mb-4 hover:text-primary transition-colors">
                            <Link to={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
                          </h2>

                          <p className="text-sm sm:text-base text-muted leading-relaxed normal-case mb-6">
                            {featuredPost.excerpt}
                          </p>
                        </div>

                        <div className="pt-6 border-t border-secondary/10 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-primary text-white font-bold text-sm flex items-center justify-center shrink-0">
                              {featuredPost.authorName ? featuredPost.authorName.charAt(0) : 'N'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-secondary">{featuredPost.authorName}</p>
                              <p className="text-[11px] text-muted normal-case">{featuredPost.authorRole}</p>
                            </div>
                          </div>

                          <Link to={`/blog/${featuredPost.slug}`} className="btn-primary !px-5 !py-2.5 text-xs">
                            Read Full Article <ArrowRight size={13} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              )}

              {/* Grid of Remaining/All Posts */}
              {remainingPosts.length > 0 && (
                <div>
                  {featuredPost && (
                    <div className="flex items-center justify-between mb-6 pb-2 border-b-2 border-secondary/10">
                      <h2 className="text-xl sm:text-2xl text-secondary">All Latest Articles</h2>
                      <span className="text-xs font-semibold text-muted">
                        Showing {posts.length} {posts.length === 1 ? 'article' : 'articles'}
                      </span>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {remainingPosts.map((post, i) => (
                      <Fragment key={post.slug}>
                        <BlogCard post={post} index={i} />
                        {/* In-feed Google Ad: 3rd article ke baad (sirf blog section) */}
                        {i === 2 && remainingPosts.length > 3 && (
                          <GoogleAd
                            slot={BLOG_AD_SLOTS.blogListInFeed}
                            className="sm:col-span-2 lg:col-span-3 !my-0"
                          />
                        )}
                      </Fragment>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Consultation / Newsletter CTA */}
      <section className="bg-secondary text-white py-16 border-t-2 border-secondary">
        <div className="container-section text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl text-white mb-4">
            Need Expert Help Growing Your Business?
          </h2>
          <p className="text-white/70 text-sm sm:text-base normal-case leading-relaxed mb-8">
            From performance marketing campaigns to modern high-converting websites,
            our team in Lucknow is ready to help you scale.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/Contect-us" className="btn-primary">
              Book Free Consultation
            </Link>
            <Link to="/services" className="btn-outline-light">
              Explore Our Services
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
