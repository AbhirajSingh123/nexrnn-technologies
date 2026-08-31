/**
 * Simple export helpers: CSV, Excel, PDF
 * Used by ExportButtons in Admin panel.
 *
 * columns = same columns array used by AdminTable: [{ key, label }]
 *
 * Excel/PDF libraries ko sirf export karte waqt dynamic import kiya jaata hai,
 * taaki admin panel khulte hi heavy libs download na hon.
 */

// Action columns (Edit / View / Delete etc.) ko export se hatao
const DEFAULT_EXCLUDE = ['edit', 'delete', 'view', 'live', 'manage', 'actions', 'preview'];

function getExportColumns(columns, excludeKeys = DEFAULT_EXCLUDE) {
  return (columns || []).filter((c) => c && c.key && !excludeKeys.includes(c.key));
}

function getCellValue(row, col) {
  const raw = row ? row[col.key] : '';
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';
  if (Array.isArray(raw)) return raw.join(', ');
  if (typeof raw === 'object') return JSON.stringify(raw);
  return String(raw);
}

function buildTable(rows, columns, excludeKeys) {
  const cols = getExportColumns(columns, excludeKeys);
  const header = cols.map((c) => c.label || c.key);
  const body = (rows || []).map((row) => cols.map((c) => getCellValue(row, c)));
  return { header, body };
}

function downloadBlob(blob, filename, ext) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCSV(rows, columns, filename = 'export', excludeKeys) {
  const { header, body } = buildTable(rows, columns, excludeKeys);
  const lines = [header, ...body].map((line) => line.map(csvEscape).join(','));
  // BOM prefix so Excel bhi UTF- properly padhe
  const csv = '\uFEFF' + lines.join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename, 'csv');
}

export async function exportToExcel(rows, columns, filename = 'export', excludeKeys) {
  const { header, body } = buildTable(rows, columns, excludeKeys);
  const XLSX = await import('xlsx');

  const sheet = XLSX.utils.aoa_to_sheet([header, ...body]);
  // Column widths thoda readable set karo
  sheet['!cols'] = header.map((h, i) => ({
    wch: Math.min(
      45,
      Math.max(h.length + 2, ...body.map((row) => String(row[i] || '').length + 2))
    ),
  }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Data');
  XLSX.writeFile(book, `${filename}.xlsx`);
}

export async function exportToPDF(rows, columns, filename = 'export', title = 'Export', excludeKeys) {
  const { header, body } = buildTable(rows, columns, excludeKeys);

  // jsPDF + autotable sirf tab load hote hain jab PDF download karo
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  doc.setFontSize(14);
  doc.setTextColor(11, 18, 32);
  doc.text(title, 40, 36);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`NexRNN Technologies - ${new Date().toLocaleString('en-IN')}`, 40, 52);

  autoTable(doc, {
    head: [header],
    body,
    startY: 64,
    styles: { fontSize: 8, cellPadding: 4, textColor: [30, 41, 59] },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [244, 247, 252] },
  });

  doc.save(`${filename}.pdf`);
}
