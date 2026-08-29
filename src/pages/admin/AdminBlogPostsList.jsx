import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, ExternalLink } from 'lucide-react';
import { fetchAdminBlogPosts, deleteBlogPost } from '@/data/blogRepo';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import AdminTable from '@/components/admin/AdminTable';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ExportButtons from '@/components/admin/ExportButtons';
import { formatBlogDate } from '@/utils/blogUtils';

export default function AdminBlogPostsList() {
  const [rows, setRows] = useState([]);
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
            Published
          </span>
        ) : (
          <span className="inline-block bg-yellow-100 text-yellow-800 text-[11px] font-bold uppercase px-2 py-0.5">
            Draft
          </span>
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

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(rows, rows.length);

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

      {/* Download data: PDF / Excel / CSV */}

      <div className="mb-4">

        <ExportButtons rows={rows} columns={columns} filename="blog-posts" title="Blog Posts" />

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
