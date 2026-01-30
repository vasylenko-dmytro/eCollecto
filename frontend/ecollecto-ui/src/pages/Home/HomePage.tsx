import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import type {Product} from '../../features/product/types/product';
import {ProductCard} from '../../features/product';
import NoSearchResults from "../../features/product/components/NoSearchResults";

export default function HomePage({searchTerm}: { searchTerm: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/stamps", {signal: controller.signal});
        if (!response.ok) {
          throw new Error(`Failed to load products (${response.status})`);
        }
        const data = await response.json() as Product[];
        if (isMounted) {
          setProducts(data);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load products");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-12 lg:py-24 mx-auto">
        <div className="text-sm text-gray-500">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-12 lg:py-24 mx-auto">
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  const filteredProducts = products.filter((product) => {
    const term = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(term) ||
      product.stampSKU.toString().includes(term) ||
      product.release.year.toString().includes(term)
    );
  });

  return (
    <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-12 lg:py-24 mx-auto">
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-12">
          {filteredProducts.map((product) => (
            <div key={product.stamp_id}>
              <Link to={`/stamps/${product.stamp_id}`} className="block transition-transform hover:scale-[1.01]">
                <ProductCard product={product}/>
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
