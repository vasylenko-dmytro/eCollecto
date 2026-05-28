import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchStampsByYear } from '../../shared/api/stampsApi';
import { ProductCard } from '../../features/product';
import { ProductSchema } from '../../features/product/types/schemas/product.schema';
import type { Product } from '../../features/product/types/product';
import NoSearchResults from '../../features/product/components/NoSearchResults';

export default function YearStampsPage({ searchTerm }: { searchTerm: string }) {
  const { year } = useParams<{ year: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!year) return;
    const controller = new AbortController();
    let isMounted = true;

    const loadStamps = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const raw = await fetchStampsByYear(Number(year), controller.signal);
        if (isMounted) setProducts(ProductSchema.array().parse(raw));
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load stamps');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadStamps();
    return () => { isMounted = false; controller.abort(); };
  }, [year]);

  if (isLoading) return <div className="p-12 text-gray-500">Loading {year} stamps...</div>;
  if (error) return <div className="p-12 text-red-500">{error}</div>;

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.stampSKU.toString().includes(searchTerm)
  );

  return (
    <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-12 lg:py-24 mx-auto">
      <div className="mb-6">
        <Link to="/stamps" className="text-yellow-400 hover:underline text-sm">← Back to Catalog</Link>
        <h1 className="text-2xl font-bold text-white mt-2">Stamps of {year}</h1>
      </div>
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-12">
          {filtered.map(product => (
            <div key={product.stamp_id}>
              <Link to={`/stamps/${product.stamp_id}`} className="block transition-transform hover:scale-[1.01]">
                <ProductCard product={product} />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <NoSearchResults searchTerm={searchTerm} />
      )}
    </div>
  );
}
