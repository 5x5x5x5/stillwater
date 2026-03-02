import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { useSessionStore } from '../stores/sessionStore';
import { SessionCard } from '../components/sessions/SessionCard';

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'guided', label: 'Guided' },
  { id: 'sleep_story', label: 'Sleep Stories' },
  { id: 'soundscape', label: 'Soundscapes' },
];

const DURATION_OPTIONS = [
  { label: 'Any', value: '' },
  { label: '< 5 min', value: '0-300' },
  { label: '5-15 min', value: '300-900' },
  { label: '15-30 min', value: '900-1800' },
  { label: '30+ min', value: '1800-9999' },
];

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function LibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sessions, total, page, perPage, tags, isLoading, fetchSessions, fetchTags, setPage } = useSessionStore();

  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') ?? '');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const applyFilters = useCallback(() => {
    const [minStr, maxStr] = selectedDuration ? selectedDuration.split('-') : ['', ''];
    fetchSessions({
      category: selectedCategory || undefined,
      search: searchInput || undefined,
      min_duration: minStr ? Number(minStr) : undefined,
      max_duration: maxStr ? Number(maxStr) : undefined,
      tag: selectedTag || undefined,
      page: 1,
    });
  }, [selectedCategory, searchInput, selectedDuration, selectedTag, fetchSessions]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedDuration, selectedTag]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      applyFilters();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Sync category from URL param
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  const totalPages = Math.ceil(total / perPage);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat) {
      newParams.set('category', cat);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div className="min-h-screen px-4 md:px-8 pt-8 pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="font-serif text-3xl text-offwhite">Library</h1>
        <p className="text-offwhite/50 text-sm mt-1">{total} sessions available</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-4 mb-6"
      >
        {/* Search */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-offwhite/40">
            <SearchIcon />
          </div>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search sessions..."
            className="w-full bg-navy-light border border-white/8 rounded-xl pl-10 pr-4 py-3 text-offwhite placeholder-offwhite/30 text-sm focus:outline-none focus:border-lavender/50 focus:ring-1 focus:ring-lavender/20 transition-colors"
            aria-label="Search sessions"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="group" aria-label="Category filter">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lavender/30 ${
                selectedCategory === cat.id
                  ? 'bg-lavender text-navy font-semibold'
                  : 'bg-navy-light border border-white/8 text-offwhite/60 hover:border-white/20 hover:text-offwhite'
              }`}
              aria-pressed={selectedCategory === cat.id}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Duration + Tag filters row */}
        <div className="flex gap-3 flex-wrap">
          <select
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(e.target.value)}
            className="bg-navy-light border border-white/8 rounded-xl px-4 py-2 text-offwhite/70 text-sm focus:outline-none focus:border-lavender/50 focus:ring-1 focus:ring-lavender/20 transition-colors"
            aria-label="Filter by duration"
          >
            {DURATION_OPTIONS.map((d) => (
              <option key={d.value} value={d.value} className="bg-navy-dark">
                {d.label}
              </option>
            ))}
          </select>

          {tags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="bg-navy-light border border-white/8 rounded-xl px-4 py-2 text-offwhite/70 text-sm focus:outline-none focus:border-lavender/50 focus:ring-1 focus:ring-lavender/20 transition-colors"
              aria-label="Filter by tag"
            >
              <option value="" className="bg-navy-dark">All tags</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.name} className="bg-navy-dark">
                  {tag.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </motion.div>

      {/* Session grid */}
      {isLoading && sessions.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-navy-light animate-pulse" />
          ))}
        </div>
      ) : sessions.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-offwhite/50 text-sm">No sessions match your filters</p>
          <button
            onClick={() => {
              setSelectedCategory('');
              setSelectedDuration('');
              setSelectedTag('');
              setSearchInput('');
            }}
            className="mt-4 text-lavender text-sm hover:text-lavender-light transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1 || isLoading}
            className="px-4 py-2 rounded-xl bg-navy-light border border-white/8 text-sm text-offwhite/60 hover:text-offwhite disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-offwhite/50">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="px-4 py-2 rounded-xl bg-navy-light border border-white/8 text-sm text-offwhite/60 hover:text-offwhite disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
