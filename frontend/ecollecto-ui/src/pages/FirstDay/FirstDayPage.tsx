import type {FirstDayIssue} from "../../features/product/types/firstdayissue";
import {Link} from "react-router-dom";
import FirstDayCollection
  from "../../features/product/components/FirstDayIssue/FirstDayCollection";
import NoSearchResults from "../../features/product/components/NoSearchResults";
import React, {useEffect, useState} from "react";

export default function FirstDayPage({searchTerm}: { searchTerm: string }) {
  const [collectionProducts, setCollectionProducts] = useState<FirstDayIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadFirstDayCovers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/first-day-covers", {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Failed to load first day covers (${response.status})`);
        }
        const data = await response.json() as FirstDayIssue[];
        if (isMounted) {
          setCollectionProducts(data);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load first day covers");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadFirstDayCovers();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-6 lg:py-12 mx-auto">
        <div className="text-sm text-gray-500">Loading first day covers...</div>
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
      product.release.year.toString().includes(term)
    );
  });

  return (
    <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-6 lg:py-12 mx-auto">
      {filteredProducts.length > 0 ? (
        <div className="flex flex-col gap-8 md:gap-12">
          {filteredProducts.map((product) => (
            <div key={product.postmark_id}>
              <Link to={`/firstday`}>
                <FirstDayCollection product={product}/>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <NoSearchResults searchTerm={searchTerm}/>
      )}
    </div>
  )
}
