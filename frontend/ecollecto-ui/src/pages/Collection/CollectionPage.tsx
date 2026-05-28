import StampImageCollectionGallery
  from "../../features/product/components/CollectionDetails/StampImageCollectionGallery";
import type {Product} from "../../features/product/types/product";
import {ProductSchema} from "../../features/product/types/schemas/product.schema";
import {Link} from "react-router-dom";
import React, {useEffect, useState} from "react";
import NoSearchResults from "../../features/product/components/NoSearchResults";
import {fetchStampYears, fetchStampsByYear} from "../../shared/api/stampsApi";

type YearSummary = { year: number; count: number };

export default function CollectionPage({searchTerm}: { searchTerm: string }) {
  const [years, setYears] = useState<YearSummary[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [collectionProducts, setCollectionProducts] = useState<Product[]>([]);
  const [isLoadingYears, setIsLoadingYears] = useState(true);
  const [isLoadingStamps, setIsLoadingStamps] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available years on mount
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadYears = async () => {
      try {
        const data = await fetchStampYears(controller.signal);
        if (isMounted) {
          setYears(data);
          if (data.length > 0) {
            setSelectedYear(data[0].year); // most recent year first (sorted desc)
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load years');
      } finally {
        if (isMounted) setIsLoadingYears(false);
      }
    };

    void loadYears();
    return () => { isMounted = false; controller.abort(); };
  }, []);

  // Load stamps whenever selected year changes
  useEffect(() => {
    if (selectedYear == null) return;

    const controller = new AbortController();
    let isMounted = true;

    const loadStamps = async () => {
      try {
        setIsLoadingStamps(true);
        setError(null);
        const raw = await fetchStampsByYear(selectedYear, controller.signal);
        if (isMounted) setCollectionProducts(ProductSchema.array().parse(raw));
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load stamps');
      } finally {
        if (isMounted) setIsLoadingStamps(false);
      }
    };

    void loadStamps();
    return () => { isMounted = false; controller.abort(); };
  }, [selectedYear]);

  if (isLoadingYears) {
    return (
      <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-6 lg:py-12 mx-auto">
        <div className="text-sm text-gray-500">Loading collection...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-6 lg:py-12 mx-auto">
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  const filteredProducts = collectionProducts.filter((product) => {
    const term = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(term) ||
      product.stampSKU.toString().includes(term) ||
      product.release.year.toString().includes(term)
    );
  });

  return (
    <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-6 lg:py-12 mx-auto">

      {/* Year selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {years.map(({year, count}) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              selectedYear === year
                ? 'bg-yellow-400 text-black'
                : 'bg-neutral-700 text-gray-300 hover:bg-neutral-600'
            }`}
          >
            {year}
            <span className={`ml-1.5 text-xs ${selectedYear === year ? 'text-black/60' : 'text-gray-500'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Stamp grid */}
      {isLoadingStamps ? (
        <div className="text-sm text-gray-500">Loading {selectedYear} stamps...</div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-2">
          {filteredProducts.map((product) => (
            <div key={product.stamp_id}>
              <Link to={`/stamps/${product.stamp_id}`}>
                <StampImageCollectionGallery product={product}/>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <NoSearchResults searchTerm={searchTerm}/>
      )}
    </div>
  );
}
