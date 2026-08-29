import { Search, X } from 'lucide-react';

export default function BlogFilterBar({
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
  searchQuery = '',
  onSearchChange,
}) {
  return (
    <div className="mb-10 space-y-5">
      {/* Search Input */}
      <div className="relative max-w-md mx-auto">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40 pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search articles by title, topic, or keyword..."
          className="w-full bg-white border-2 border-secondary pl-11 pr-10 py-3 text-sm placeholder:text-secondary/40 focus:border-primary outline-none transition-colors shadow-[3px_3px_0_#0B1220]"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-secondary p-1"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        <button
          onClick={() => onSelectCategory('all')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-secondary transition-all ${
            selectedCategory === 'all'
              ? 'bg-primary text-white shadow-[2px_2px_0_#0B1220]'
              : 'bg-white text-secondary hover:bg-accent'
          }`}
        >
          All Topics
        </button>

        {categories.map((cat) => {
          const isActive = selectedCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => onSelectCategory(cat.slug)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-secondary transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-[2px_2px_0_#0B1220]'
                  : 'bg-white text-secondary hover:bg-accent'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
