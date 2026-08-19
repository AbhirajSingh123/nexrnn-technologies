import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '@/services/supabaseClient';
import { formatDateTimeWithDay } from '@/utils/formatDateTime';
import AdminTable from '@/components/admin/AdminTable';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function AdminLeadsCourses() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('leads_course').select('*').order('created_at', { ascending: false });
    if (error) toast.error('Failed to load enrollments.');
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this enrollment?')) return;
    const { error } = await supabase.from('leads_course').delete().eq('id', row.id);
    if (error) toast.error('Delete failed.');
    else {
      toast.success('Enrollment deleted.');
      load();
    }
  };

  const courseOptions = useMemo(
    () => [...new Set(rows.map((r) => r.course_title))].sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (courseFilter !== 'all' && r.course_title !== courseFilter) return false;
      if (dateFrom && new Date(r.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(r.created_at) > new Date(`${dateTo}T23:59:59`)) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = [r.name, r.email, r.phone, r.course_title, r.college, r.payment_ref_no].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, dateFrom, dateTo, courseFilter]);

  const columns = [
    { key: 'created_at', label: 'Date', render: (r) => formatDateTimeWithDay(r.created_at) },
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'course_title', label: 'Course' },
    { key: 'price', label: 'Price' },
    { key: 'college', label: 'College' },
    { key: 'payment_ref_no', label: 'Payment Ref No.' },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl text-secondary mb-1">Course Enrollments</h1>
      <p className="text-sm text-muted normal-case mb-6">Submissions from the course enrollment popup, including payment reference numbers.</p>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        extra={
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-muted mb-1">Course</label>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white max-w-[220px]"
            >
              <option value="all">All Courses</option>
              {courseOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        }
      />

      {loading ? <LoadingSpinner /> : <AdminTable columns={columns} rows={filteredRows} onDelete={handleDelete} />}
    </div>
  );
}
