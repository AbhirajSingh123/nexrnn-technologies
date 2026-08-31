/**
 * Admin list pages ke header mein lagne wale download buttons.
 * Usage:
 *   <ExportButtons rows={rows} columns={columns} filename="courses" title="Courses" />
 */
import { toast } from 'react-toastify';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/exportUtils';

const btnClass =
  'inline-flex items-center gap-1.5 border-2 border-secondary/20 bg-white px-3 py-1.5 text-xs font-bold text-secondary hover:border-primary hover:text-primary transition-colors';

export default function ExportButtons({ rows = [], columns = [], filename = 'export', title, excludeKeys }) {
  const safeTitle = title || filename;

  const handle = async (type) => {
    if (!rows || rows.length === 0) {
      toast.info('No data available to export.');
      return;
    }
    try {
      if (type === 'csv') exportToCSV(rows, columns, filename, excludeKeys);
      if (type === 'excel') await exportToExcel(rows, columns, filename, excludeKeys);
      if (type === 'pdf') await exportToPDF(rows, columns, filename, safeTitle, excludeKeys);
      toast.success(`Exporting full data (${rows.length} records) as ${type.toUpperCase()}...`);
    } catch (err) {
      toast.error(`Export failed: ${err?.message || 'unknown error'}`);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
        <Download size={13} /> Download
      </span>
      <button type="button" onClick={() => handle('csv')} className={btnClass} title="CSV file">
        <FileText size={13} /> CSV
      </button>
      <button type="button" onClick={() => handle('excel')} className={btnClass} title="Excel file">
        <FileSpreadsheet size={13} /> Excel
      </button>
      <button type="button" onClick={() => handle('pdf')} className={btnClass} title="PDF file">
        <FileText size={13} /> PDF
      </button>
    </div>
  );
}
