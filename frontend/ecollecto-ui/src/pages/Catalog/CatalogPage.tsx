import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStampYears } from '../../shared/api/stampsApi';

type YearSummary = { year: number; count: number };

export default function CatalogPage({ searchTerm }: { searchTerm: string }) {
  const [years, setYears] = useState<YearSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadYears = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchStampYears(controller.signal);
        if (isMounted) setYears(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load catalog');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadYears();
    return () => { isMounted = false; controller.abort(); };
  }, []);

  if (isLoading) return <div className="p-12 text-gray-500">Loading catalog...</div>;
  if (error) return <div className="p-12 text-red-500">{error}</div>;

  const filtered = years.filter(y => y.year.toString().includes(searchTerm));

  return (
    <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-12 lg:py-24 mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Ukrainian Stamps by Year</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map(({ year, count }) => (
          <Link
            key={year}
            to={`/stamps/year/${year}`}
            className="flex flex-col items-center justify-center rounded-lg bg-neutral-800 hover:bg-yellow-400 hover:text-black text-white p-6 transition-colors"
          >
            <span className="text-2xl font-bold">{year}</span>
            <span className="text-sm mt-1 text-gray-400 group-hover:text-black">{count} stamps</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
