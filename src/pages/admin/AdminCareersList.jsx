import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, ExternalLink } from 'lucide-react';
import { fetchAdminCareers, deleteCareer, isLastDatePassed } from '@/data/careersRepo';
import { supabase } from '@/services/supabaseClient';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import AdminTable from '@/components/admin/AdminTable';
import AdminLoadMore from '@/components/admin/AdminLoadMore';
import { useLoadMore } from '@/hooks/useLoadMore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ExportButtons from '@/components/admin/ExportButtons';
import { useAdminSearch } from '@/hooks/useAdminSearch';

export default function AdminCareersList() {
  const [rows, setRows] = useState([]);
  const navigate = useNavigate();
  const [appCounts, setAppCounts] = useState({});
  const { search, setSearch, filtered } = useAdminSearch(rows);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminCareers();
      setRows(data ?? []);

      // Har opening ke applications ki count (participants jaisa hi concept)
      try {
        const { data: apps, error } = await supabase
          .from('internship_applications')
          .select('opening_slug');
        if (!error && apps) {
          const counts = {};
          for (const a of apps) {
            counts[a.opening_slug] = (counts[a.opening_slug] || 0) + 1;
          }
          setAppCounts(counts);
        }
      } catch { /* counts optional hain */ }
    } catch {
      toast.error('Failed to load careers.');
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
        .from('careers')
        .update({ is_published: !row.isPublished })
        .eq('id', row.id);
      if (error) throw error;
      toast.success(row.isPublished ? 'Opening hidden from website.' : 'Opening is live again!');
      load();
    } catch {
      toast.error('Could not update visibility.');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete opening "${row.title}"?`)) return;
    try {
      await deleteCareer(row.id);
      toast.success('Opening deleted.');
      load();
    } catch {
      toast.error('Delete failed.');
    }
  };

  const columns = [
    { key: 'career_code', label: 'Career ID', render: (r) => (
      <span className="font-mono text-xs text-primary font-bold">{r.careerCode || '—'}</span>
    ) },
    { key: 'applicants', label: 'Applicants', render: (r) => (
      <button
        onClick={() => navigate(`${ADMIN_ROUTES.internshipApplications}?opening=${r.slug}`)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
        title="View applications for this opening"
      >
        {appCounts[r.slug] || 0} <ExternalLink size={11} />
      </button>
    ) },
    { key: 'title', label: 'Title', render: (r) => (
      <span className="text-sm font-semibold text-secondary normal-case line-clamp-2 max-w-[220px]">{r.title}</span>
    ) },
    { key: 'type', label: 'Type', render: (r) => (
      <span className={`text-[11px] font-bold uppercase px-2 py-0.5 border ${r.type === 'internship' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
        {r.type === 'internship' ? 'Internship' : 'Job'}
      </span>
    ) },
    { key: 'location', label: 'Location', render: (r) => (
      <span className="text-xs text-secondary normal-case">{r.location || '—'}</span>
    ) },
    { key: 'last_date', label: 'Last Date', render: (r) => (
      <span className="text-xs text-secondary normal-case">
        {r.lastDateApply
          ? new Date(r.lastDateApply + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : '—'}
      </span>
    ) },
    { key: 'domain', label: 'Domain', render: (r) => (
      <span className="text-xs text-secondary normal-case">{r.domain || '\u2014'}</span>
    ) },
    { key: 'duration_dates', label: 'Start \u2013 End', render: (r) => (
      <span className="text-xs text-secondary normal-case whitespace-nowrap">
        {r.startDate && r.endDate
          ? `${new Date(r.startDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} \u2013 ${new Date(r.endDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
          : '\u2014'}
      </span>
    ) },
    { key: 'duration', label: 'Duration', render: (r) => (
      <span className="text-xs text-secondary normal-case">{r.duration || '—'}</span>
    ) },
    { key: 'stipend', label: 'Stipend', render: (r) => (
      r.type === 'internship' ? (
        <span className={`text-[11px] font-bold uppercase px-2 py-0.5 border ${r.stipendType === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-accent text-muted border-secondary/20'}`}>
          {r.stipendType === 'paid' ? r.stipendText || 'Paid' : 'Unpaid'}
        </span>
      ) : (
        <span className="text-xs text-muted">—</span>
      )
    ) },
    { key: 'fee', label: 'Fee', render: (r) => (
      <span className={`text-[11px] font-bold uppercase px-2 py-0.5 border ${r.feeType === 'paid' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
        {r.feeType === 'paid' ? `\u20b9${r.feeAmount}` : 'Free'}
      </span>
    ) },
    { key: 'status', label: 'Status', render: (r) => {
      const closed = isLastDatePassed(r.lastDateApply);
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          {r.isPublished ? (
            <span className="inline-block bg-green-100 text-green-800 text-[11px] font-bold uppercase px-2 py-0.5">Live</span>
          ) : (
            <span className="inline-block bg-yellow-100 text-yellow-800 text-[11px] font-bold uppercase px-2 py-0.5">Hidden</span>
          )}
          {closed && (
            <span className="inline-block bg-red-50 text-primary text-[11px] font-bold uppercase px-2 py-0.5 border border-red-200">Closed</span>
          )}
        </div>
      );
    } },
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
        to={`/careers/${r.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-secondary"
        title="View live opening"
      >
        Live <ExternalLink size={12} />
      </Link>
    ) },
    { key: 'edit', label: 'Edit', render: (r) => (
      <Link to={ADMIN_ROUTES.careerEdit(r.id)} className="text-primary font-semibold hover:underline text-xs">Edit</Link>
    ) },
    { key: 'delete', label: 'Delete', render: (r) => (
      <button onClick={() => handleDelete(r)} className="text-primary font-semibold hover:underline text-xs">Delete</button>
    ) },
  ];

  // Export ke liye FULL rows
  const exportRows = filtered.map((r) => ({
    career_code: r.careerCode || '',
    applicants: appCounts[r.slug] || 0,
    id: r.id || '',
    title: r.title || '',
    slug: r.slug || '',
    type: r.type === 'internship' ? 'Internship' : 'Job',
    location: r.location || '',
    last_date_apply: r.lastDateApply
      ? new Date(r.lastDateApply + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '',
    application_status: isLastDatePassed(r.lastDateApply) ? 'Closed' : 'Open',
    domain: r.domain || '',
    start_date: r.startDate
      ? new Date(r.startDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '',
    end_date: r.endDate
      ? new Date(r.endDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '',
    duration: r.duration || '',
    stipend_type: r.type === 'internship' ? (r.stipendType === 'paid' ? 'Paid' : 'Unpaid') : '—',
    stipend_text: r.stipendText || '',
    fee_type: r.feeType === 'paid' ? 'Paid' : 'Free',
    fee_amount: r.feeAmount ?? 0,
    publish_status: r.isPublished ? 'Live' : 'Hidden',
    publishedAt: r.publishedAt ? new Date(r.publishedAt).toLocaleString('en-IN') : '',
    excerpt: r.excerpt || '',
    content: r.content || '',
    createdAt: r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : '',
  }));

  // Export columns: exportRows keys se EXACT match (blank fields fix)
  const exportColumns = [
    { key: 'career_code', label: 'Career ID' },
    { key: 'applicants', label: 'Applicants' },
    { key: 'title', label: 'Title' },
    { key: 'slug', label: 'Slug' },
    { key: 'type', label: 'Type' },
    { key: 'location', label: 'Location' },
    { key: 'domain', label: 'Domain' },
    { key: 'duration', label: 'Duration' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'end_date', label: 'End Date' },
    { key: 'stipend_type', label: 'Stipend' },
    { key: 'stipend_text', label: 'Stipend Details' },
    { key: 'fee_type', label: 'Application Fee' },
    { key: 'fee_amount', label: 'Fee Amount' },
    { key: 'last_date_apply', label: 'Last Date to Apply' },
    { key: 'application_status', label: 'Open / Closed' },
    { key: 'publish_status', label: 'Status' },
    { key: 'publishedAt', label: 'Published At' },
    { key: 'excerpt', label: 'Excerpt' },
    { key: 'createdAt', label: 'Created At' },
  ];

  const { visibleItems, hasMore, loadMore, total, shown } = useLoadMore(filtered, search + '|' + filtered.length);

  return (
    <div>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="font-heading text-3xl text-secondary">Careers</h1>
        <Link to={ADMIN_ROUTES.careerNew} className="btn-primary inline-flex items-center gap-2">
          <Plus size={16} /> New Opening
        </Link>
      </div>
      <p className="text-sm text-muted normal-case mb-6">
        Jobs and internships shown on the public website at /careers.
      </p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, location…"
          className="w-full sm:w-72 border-2 border-secondary/20 focus:border-primary px-4 py-2.5 text-sm outline-none transition-colors bg-white normal-case"
        />
        <ExportButtons rows={exportRows} columns={exportColumns} filename="careers" title="Careers" />
      </div>

      {loading ? (
        <LoadingSpinner className="min-h-[40vh]" />
      ) : (
        <>
          <AdminTable columns={columns} rows={visibleItems} emptyLabel="No openings yet. Click 'New Opening' to add one." />
          <AdminLoadMore hasMore={hasMore} onLoadMore={loadMore} total={total} shown={shown} />
        </>
      )}
    </div>
  );
}
