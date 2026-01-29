import React from 'react';
import {Link} from 'react-router-dom';
import type {Product} from '../../features/product/types/product';
import {ProductCard} from '../../features/product';
import productData from '../../features/product/data/productData.json';
import NoSearchResults from "../../features/product/components/NoSearchResults";

export default function HomePage({searchTerm}: { searchTerm: string }) {
  const products: Product[] = productData;
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