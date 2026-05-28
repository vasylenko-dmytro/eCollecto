import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { fetchStampById, fetchStampYears } from '../../shared/api/stampsApi';
import { ProductSchema } from '../../features/product/types/schemas/product.schema';
import type { Product } from '../../features/product/types/product';
import StampImageCollectionGallery
  from '../../features/product/components/CollectionDetails/StampImageCollectionGallery';
import { EmptyState } from '../../shared/ui/EmptyState';

type YearSummary = { year: number; count: number };

export default function MyCollectionPage() {
  const stampIds       = useSelector((state: RootState) => state.collection.stampIds);
  const collStatus     = useSelector((state: RootState) => state.collection.status);

  const [stamps,    setStamps]    = useState<Product[]>([]);
  const [years,     setYears]     = useState<YearSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Fetch year totals for progress bars
  useEffect(() => {
    const controller = new AbortController();
    fetchStampYears(controller.signal)
      .then(data => setYears(data as YearSummary[]))
      .catch(() => {/* non-critical */});
    return () => controller.abort();
  }, []);

  // Fetch stamp details for every collected ID
  useEffect(() => {
    if (collStatus === 'loading') return;

    setIsLoading(true);
    setError(null);
    const controller = new AbortController();

    const load = async () => {
      try {
        if (stampIds.length === 0) {
          setStamps([]);
          return;
        }
        const raw = await Promise.all(stampIds.map(id => fetchStampById(id, controller.signal)));
        setStamps(ProductSchema.array().parse(raw));
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load stamps');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [stampIds, collStatus]);

  // Group collected stamps by year
  const byYear = useMemo(() => {
    const map = new Map<number, Product[]>();
    for (const s of stamps) {
      const yr = s.release.year;
      if (!map.has(yr)) map.set(yr, []);
      map.get(yr)!.push(s);
    }
    return map;
  }, [stamps]);

  // Build year→total lookup
  const yearTotal = useMemo(() => {
    const m: Record<number, number> = {};
    for (const { year, count } of years) m[year] = count;
    return m;
  }, [years]);

  if (collStatus === 'loading' || isLoading) {
    return (
      <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-12 mx-auto">
        <div className="text-gray-400 text-sm">Loading your collection…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-12 mx-auto">
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  if (stampIds.length === 0) {
    return (
      <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-12 mx-auto">
        <EmptyState
          icon="📦"
          title="Your album is empty!"
          description="Start adding stamps from the catalog to build your personal collection."
          ctaLabel="Explore Catalog"
          ctaTo="/stamps"
        />
      </div>
    );
  }

  const sortedYears = [...byYear.keys()].sort((a, b) => b - a);

  return (
    <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-12 mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Collection</h1>
          <p className="text-gray-400 text-sm mt-1">{stamps.length} stamp{stamps.length !== 1 ? 's' : ''} collected</p>
        </div>
        <Link to="/stamps" className="text-yellow-400 hover:underline text-sm">+ Add more</Link>
      </div>

      {/* Per-year sections */}
      {sortedYears.map(year => {
        const yearStamps = byYear.get(year)!;
        const total      = yearTotal[year];
        const pct        = total ? Math.round((yearStamps.length / total) * 100) : null;

        return (
          <section key={year} className="mb-10">
            {/* Year header + progress */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-white font-semibold">{year}</h2>
                <span className="text-gray-400 text-xs">
                  {yearStamps.length}{total != null ? ` of ${total}` : ''} stamp{yearStamps.length !== 1 ? 's' : ''}
                  {pct != null ? ` · ${pct}%` : ''}
                </span>
              </div>
              {pct != null && (
                <div className="h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>

            {/* Stamp thumbnails */}
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2">
              {yearStamps.map(stamp => (
                <Link key={stamp.stamp_id} to={`/stamps/${stamp.stamp_id}`}>
                  <StampImageCollectionGallery product={stamp} />
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}


