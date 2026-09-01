import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Pencil, X, Newspaper, ExternalLink } from 'lucide-react';
import useMentorData from '@/hooks/useMentorData';
import { mentorData } from '@/data/mentorAuth';
import { MENTOR_ROUTES } from '@/constants/mentorRoutes';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white normal-case';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-1.5';

const STATUS_STYLES = {
  published: 'border-green-300 bg-green-50 text-green-700',
  draft: 'border-orange-300 bg-orange-50 text-orange-600',
};

export default function MentorBlog() {
  const navigate = useNavigate();
  const { data, error, loading } = useMentorData('blogs_list');
  const [form, setForm] = useState(null); // {mode, post?}
  const rows = useMemo(() => data?.rows ?? [], [data]);

  return (
    <div>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <div className="flex items-center justify-between gap-4 mb-1">
        <h1 className="font-heading text-3xl text-secondary">My Blogs</h1>
        <button onClick={() => setForm({ mode: 'add', post: null })} className="btn-primary inline-flex items-center gap-2 shrink-0">
          <Plus size={15} /> New Post
        </button>
      </div>
      <p className="text-sm text-muted normal-case mb-6">
        Only posts written by you appear here. Published posts are visible to everyone in the website's blog section.
      </p>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-sm text-primary normal-case">{error}</p>
      ) : rows.length === 0 ? (
        <div className="card-base bg-white p-10 text-center">
          <Newspaper size={28} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-muted normal-case mb-4">You haven't written any posts yet.</p>
          <button onClick={() => setForm({ mode: 'add', post: null })} className="btn-secondary">Write your first post</button>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((b) => (
            <div key={b.id} className="card-base bg-white p-5 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="font-mono text-[11px] font-bold text-primary">{b.blogCode || '—'}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 border-2 ${STATUS_STYLES[b.isPublished ? 'published' : 'draft']}`}>
                    {b.isPublished ? 'Published' : 'Draft'}
                  </span>
                  {b.views > 0 && <span className="text-[10px] text-muted">{b.views} views</span>}
                </div>
                <h3 className="font-heading text-lg text-secondary normal-case leading-snug">{b.title}</h3>
                <p className="text-xs text-muted normal-case mt-1 line-clamp-2">{b.excerpt}</p>
                <p className="text-[10px] text-muted normal-case mt-1.5">
                  {b.publishedAt ? new Date(b.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                  {' • '}{b.readingTime || '5 min read'}
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                {b.isPublished && b.slug && (
                  <a
                    href={`/blog/${b.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 border-2 border-secondary/20 bg-white px-3 py-2 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors"
                  >
                    <ExternalLink size={13} /> View
                  </a>
                )}
                <button
                  onClick={() => setForm({ mode: 'edit', post: b })}
                  className="inline-flex items-center gap-1.5 border-2 border-secondary/20 bg-white px-3 py-2 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors"
                >
                  <Pencil size={13} /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <BlogForm
          post={form.post}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            navigate(0); // list refresh
          }}
        />
      )}
    </div>
  );
}

/** Blog write/edit form (sirf apne posts) */
function BlogForm({ post, onClose, onSaved }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [f, setF] = useState({
    title: post?.title || '',
    category_slug: post?.categorySlug || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    cover_image_url: post?.coverImageUrl || '',
    tags: (post?.tags || []).join(', '),
    is_published: post ? !!post.isPublished : true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    mentorData('blog_categories')
      .then((d) => {
        if (!active) return;
        setCategories(d.categories || []);
        setF((prev) => ({ ...prev, category_slug: prev.category_slug || (d.categories?.[0]?.slug ?? '') }));
      })
      .catch(() => {
        /* categories optional */
      });
    return () => {
      active = false;
    };
  }, []);

  const set = (field) => (e) => setF((prev) => ({ ...prev, [field]: e.target.value }));

  const words = (f.content || '').trim().split(/\s+/).filter(Boolean).length;

  const handleSubmit = async () => {
    if (!f.title.trim() || !f.content.trim() || !f.category_slug) {
      toast.error('Title, Category and Content are required.');
      return;
    }
    setSaving(true);
    try {
      await mentorData('blog_save', {
        id: post?.id,
        fields: {
          ...f,
          tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean),
        },
      });
      toast.success(post ? 'Post updated.' : 'Post created.');
      onSaved();
    } catch (err) {
      if (err?.status === 401) {
        navigate(MENTOR_ROUTES.login, { replace: true });
        return;
      }
      toast.error(err.message || 'Save failed.');
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-secondary/70 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-white border-2 border-secondary max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between px-5 sm:px-7 pt-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5">
              {post ? `Edit — ${post.blogCode || ''}` : 'New Blog Post'}
            </p>
            <h2 className="font-heading text-xl text-secondary normal-case">{post ? post.title : 'Write a post'}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-secondary">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 sm:p-7 pt-4 space-y-4">
          <div>
            <label className={labelClass}>Title *</label>
            <input className={inputClass} value={f.title} onChange={set('title')} placeholder="Post title" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category *</label>
              <select className={inputClass} value={f.category_slug} onChange={set('category_slug')}>
                {categories.length === 0 && <option value="">Loading…</option>}
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Tags (comma separated)</label>
              <input className={inputClass} value={f.tags} onChange={set('tags')} placeholder="google-ads, marketing" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Excerpt (short summary)</label>
            <textarea rows={2} className={`${inputClass} resize-y`} value={f.excerpt} onChange={set('excerpt')} placeholder="1-2 line summary" />
          </div>
          <div>
            <label className={labelClass}>Cover Image URL (optional)</label>
            <input className={inputClass} value={f.cover_image_url} onChange={set('cover_image_url')} placeholder="https://…" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`${labelClass} !mb-0`}>Content * (markdown supported)</label>
              <span className="text-[10px] text-muted normal-case">{words} words</span>
            </div>
            <textarea rows={12} className={`${inputClass} resize-y font-mono text-xs`} value={f.content} onChange={set('content')} placeholder="Write your article here…" />
          </div>
          <label className="flex items-center gap-2.5">
            <input type="checkbox" className="w-4 h-4 accent-primary" checked={f.is_published} onChange={(e) => setF((prev) => ({ ...prev, is_published: e.target.checked }))} />
            <span className="text-sm font-semibold text-secondary">Published (uncheck for draft — only visible to you)</span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
              {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : post ? 'Update Post' : 'Create Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
