import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, ExternalLink, Search } from 'lucide-react';
import { fetchAdminBlogPosts, deleteBlogPost } from '@/data/blogRepo';
import { supabase } from '@/services/supabaseClient';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import AdminTable from '@/components/admin/AdminTable';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ExportButtons from '@/components/admin/ExportButtons';
import { useAdminSearch } from '@/hooks/useAdminSearch';
import { formatBlogDate } from '@/utils/blogUtils';

export default function AdminBlogPostsList() {
  const [rows, setRows] = useState([]);
  const { search, setSearch, filtered } = useAdminSearch(rows);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminBlogPosts();
      setRows(data ?? []);
    } catch {
      toast.error('Failed to load blog posts.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Blog hide/show toggle - hide karne par website par nahi dikhega
  const handleToggleVisibility = async (row) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ is_published: !row.isPublished })
        .eq('id', row.id);
      if (error) throw error;
      toast.success(row.isPublished ? 'Blog hidden from website.' : 'Blog is live again!');
      load();
    } catch {
      toast.error('Could not update visibility.');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete blog post "${row.title}"?`)) return;
    try {
      await deleteBlogPost(row.id);
      toast.success('Blog post deleted.');
      load();
    } catch {
      toast.error('Delete failed.');
    }
  };

  const columns = [
    {
      key: 'blog_code',
      label: 'Blog ID',
      render: (r) => (
        <span className="font-mono text-[11px] font-bold text-primary">{r.blogCode || '—'}</span>
      ),
    },
    {
      key: 'views',
      label: 'Views',
      render: (r) => <span className="font-semibold">{r.views ?? 0}</span>,
    },
    {
      key: 'title',
      label: 'Title',
      render: (r) => (
        <div>
          <Link
            to={ADMIN_ROUTES.blogPostEdit(r.id)}
            className="font-bold text-secondary hover:text-primary transition-colors block"
          >
            {r.title}
          </Link>
          <span className="text-xs text-muted">/blog/{r.slug}</span>
        </div>
      ),
    },
    {
      key: 'author',
      label: 'Author',
      render: (r) => (
        <span className="text-xs text-secondary normal-case">{r.authorName || '—'}</span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (r) => (
        <span className="inline-block bg-accent px-2 py-0.5 text-xs font-semibold border border-secondary/15">
          {r.categoryName || r.categorySlug}
        </span>
      ),
    },
    {
      key: 'publishedAt',
      label: 'Published',
      render: (r) => formatBlogDate(r.publishedAt),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) =>
        r.isPublished ? (
          <span className="inline-block bg-green-100 text-green-800 text-[11px] font-bold uppercase px-2 py-0.5">
            Live
          </span>
        ) : (
          <span className="inline-block bg-yellow-100 text-yellow-800 text-[11px] font-bold uppercase px-2 py-0.5">
            Hidden
          </span>
        ),
    },
    {
      key: 'visibility',
      label: 'Hide / Show',
      render: (r) => (
        <button
          onClick={() => handleToggleVisibility(r)}
          className={`text-[11px] font-bold px-2 py-1 border-2 transition-colors ${
            r.isPublished
              ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
              : 'border-green-300 text-green-700 hover:bg-green-50'
          }`}
          title={r.isPublished ? 'Hide from website' : 'Show on website'}
        >
          {r.isPublished ? 'Hide' : 'Show'}
        </button>
      ),
    },
    {
      key: 'view',
      label: 'View',
      render: (r) => (
        <Link
          to={`/blog/${r.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-secondary"
          title="View live post"
        >
          Live <ExternalLink size={12} />
        </Link>
      ),
    },
    {
      key: 'edit',
      label: 'Edit',
      render: (r) => (
        <Link
          to={ADMIN_ROUTES.blogPostEdit(r.id)}
          className="text-primary font-semibold hover:underline text-xs"
        >
          Edit
        </Link>
      ),
    },
  ];

  // Export ke liye FULL rows - category, status, dates sab include
  const exportRows = filtered.map((r) => ({
    blog_code: r.blogCode || '',
    views: r.views ?? 0,
    id: r.id || '',
    title: r.title || '',
    slug: r.slug || '',
    category: r.categoryName || r.categorySlug || '',
    status: r.isPublished ? 'Live' : 'Hidden',
    publishedAt: r.publishedAt ? new Date(r.publishedAt).toLocaleString('en-IN') : '',
    author: r.authorName || '',
    author_role: r.authorRole || '',
    tags: Array.isArray(r.tags) ? r.tags.join(', ') : r.tags || '',
    reading_time: r.readingTime || '',
    excerpt: r.excerpt || '',
    cta_text: r.ctaText || '',
    cta_url: r.ctaUrl || '',
    author_bio: r.authorBio || '',
    created_at: r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : '',
  }));

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(filtered, search + "|" + filtered.length);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-heading text-3xl text-secondary">Manage Blog Posts</h1>
        <Link to={ADMIN_ROUTES.blogPostNew} className="btn-primary !px-5 !py-2.5 text-xs">
          <Plus size={15} /> New Post
        </Link>
      </div>
      <p className="text-sm text-muted normal-case mb-6">
        Create, edit, and publish blog posts across categories.
      </p>

      {/* Search filter */}
      <div className="relative w-full sm:w-72 mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, category…"
          className="w-full border-2 border-secondary/20 focus:border-primary pl-9 pr-3 py-2 text-sm outline-none transition-colors bg-white" />
      </div>

      {/* Download data: PDF / Excel / CSV */}

      <div className="mb-4">

        <ExportButtons rows={exportRows} columns={columns} filename="blog-posts" title="Blog Posts" excludeKeys={['visibility']} />

      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <AdminTable
            columns={columns}
            rows={visibleItems}
            onDelete={handleDelete}
            emptyLabel="No blog posts found. Click 'New Post' to create your first article!"
          />
          <AdminLoadMore shown={shown} total={total} hasMore={hasMore} onLoadMore={loadMore} />
        </>
      )}
    </div>
  );
}
