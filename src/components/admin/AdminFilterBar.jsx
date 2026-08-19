import { Search } from 'lucide-react';

const inputClass = 'border-2 border-secondary/20 focus:border-primary px-3 py-2 text-sm outline-none transition-colors bg-white';

export default function AdminFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search name, email, phone…',
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  extra,
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 mb-5">
      <div className="relative flex-1 min-w-[220px]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className={`${inputClass} w-full pl-9`}
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wide text-muted mb-1">From</label>
        <input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wide text-muted mb-1">To</label>
        <input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} className={inputClass} />
      </div>
      {extra}
    </div>
  );
}
