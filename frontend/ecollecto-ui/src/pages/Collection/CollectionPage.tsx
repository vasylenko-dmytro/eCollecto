import StampImageCollectionGallery
  from "../../features/product/components/CollectionDetails/StampImageCollectionGallery";
import type {Product} from "../../features/product/types/product";
import {Link} from "react-router-dom";
import React, {useEffect, useState} from "react";
import NoSearchResults from "../../features/product/components/NoSearchResults";

export default function CollectionPage({searchTerm}: { searchTerm: string }) {
  const [collectionProducts, setCollectionProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadCollection = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/stamps", {signal: controller.signal});
        if (!response.ok) {
          throw new Error(`Failed to load collection (${response.status})`);
        }
        const data = await response.json() as Product[];
        if (isMounted) {
          setCollectionProducts(data);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load collection");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadCollection();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  if (isLoading) {
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
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-2">
          {filteredProducts.map((product) => (
            <div key={product.stamp_id}>
              <Link to={`/collection`}>
                <StampImageCollectionGallery product={product}/>
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
