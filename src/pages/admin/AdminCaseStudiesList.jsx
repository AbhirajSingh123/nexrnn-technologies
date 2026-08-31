import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, ExternalLink } from 'lucide-react';
import { fetchAdminCaseStudies, deleteCaseStudy } from '@/data/caseStudiesRepo';
import { supabase } from '@/services/supabaseClient';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import AdminTable from '@/components/admin/AdminTable';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ExportButtons from '@/components/admin/ExportButtons';
import { useAdminSearch } from '@/hooks/useAdminSearch';
import { formatBlogDate } from '@/utils/blogUtils';

export default function AdminCaseStudiesList() {
  const [rows, setRows] = useState([]);
  const { search, setSearch, filtered } = useAdminSearch(rows);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminCaseStudies();
      setRows(data ?? []);
    } catch {
      toast.error('Failed to load case studies.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleVisibility = async (row) => {
    try {
      const { error } = await supabase
        .from('case_studies')
        .update({ is_published: !row.isPublished })
        .eq('id', row.id);
      if (error) throw error;
      toast.success(row.isPublished ? 'Case study hidden from website.' : 'Case study is live again!');
      load();
    } catch {
      toast.error('Could not update visibility.');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete case study "${row.title}"?`)) return;
    try {
      await deleteCaseStudy(row.id);
      toast.success('Case study deleted.');
      load();
    } catch {
      toast.error('Delete failed.');
    }
  };

  const columns = [
    { key: 'case_code', label: 'Case ID', render: (r) => (
      <span className="font-mono text-xs text-primary font-bold">{r.caseCode || '—'}</span>
    ) },
    { key: 'views', label: 'Views', render: (r) => (
      <span className="text-xs text-secondary">{r.views ?? 0}</span>
    ) },
    { key: 'title', label: 'Title', render: (r) => (
      <span className="text-sm font-semibold text-secondary normal-case line-clamp-2 max-w-[260px]">{r.title}</span>
    ) },
    { key: 'client', label: 'Client', render: (r) => (
      <span className="text-xs text-secondary normal-case">{r.clientName || '—'}</span>
    ) },
    { key: 'industry', label: 'Industry', render: (r) => (
      <span className="inline-block bg-accent px-2 py-0.5 text-xs font-semibold border border-secondary/15 normal-case">{r.industry || '—'}</span>
    ) },
    { key: 'publishedAt', label: 'Published', render: (r) => formatBlogDate(r.publishedAt) },
    { key: 'status', label: 'Status', render: (r) =>
      r.isPublished ? (
        <span className="inline-block bg-green-100 text-green-800 text-[11px] font-bold uppercase px-2 py-0.5">Live</span>
      ) : (
        <span className="inline-block bg-yellow-100 text-yellow-800 text-[11px] font-bold uppercase px-2 py-0.5">Hidden</span>
      ),
    },
    { key: 'visibility', label: 'Hide / Show', render: (r) => (
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
    ) },
    { key: 'view', label: 'View', render: (r) => (
      <Link
        to={`/case-studies/${r.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-secondary"
        title="View live case study"
      >
        Live <ExternalLink size={12} />
      </Link>
    ) },
    { key: 'edit', label: 'Edit', render: (r) => (
      <Link to={ADMIN_ROUTES.caseStudyEdit(r.id)} className="text-primary font-semibold hover:underline text-xs">
        Edit
      </Link>
    ) },
    { key: 'delete', label: 'Delete', render: (r) => (
      <button onClick={() => handleDelete(r)} className="text-primary font-semibold hover:underline text-xs">
        Delete
      </button>
    ) },
  ];

  // Export ke liye FULL rows
  const exportRows = filtered.map((r) => ({
    case_code: r.caseCode || '',
    views: r.views ?? 0,
    id: r.id || '',
    title: r.title || '',
    slug: r.slug || '',
    client: r.clientName || '',
    industry: r.industry || '',
    status: r.isPublished ? 'Live' : 'Hidden',
    publishedAt: r.publishedAt ? new Date(r.publishedAt).toLocaleString('en-IN') : '',
    tags: Array.isArray(r.tags) ? r.tags.join(', ') : r.tags || '',
    excerpt: r.excerpt || '',
    content: r.content || '',
    createdAt: r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : '',
  }));

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(filtered, search + '|' + filtered.length);

  return (
    <div>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="font-heading text-3xl text-secondary">Case Studies</h1>
        <Link
          to={ADMIN_ROUTES.caseStudyNew}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus size={16} /> New Case Study
        </Link>
      </div>
      <p className="text-sm text-muted normal-case mb-6">
        Client success stories shown on the public website at /case-studies.
      </p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, client, industry…"
          className="w-full sm:w-72 border-2 border-secondary/20 focus:border-primary px-4 py-2.5 text-sm outline-none transition-colors bg-white normal-case"
        />
        <ExportButtons rows={exportRows} columns={columns} filename="case-studies" title="Case Studies" />
      </div>

      {loading ? (
        <LoadingSpinner className="min-h-[40vh]" />
      ) : (
        <>
          <AdminTable columns={columns} rows={visibleItems} emptyLabel="No case studies yet. Click 'New Case Study' to add one." />
          <AdminLoadMore hasMore={hasMore} onLoadMore={loadMore} total={total} shown={shown} />
        </>
      )}
    </div>
  );
}
