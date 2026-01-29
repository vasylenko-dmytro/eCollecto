import StampImageCollectionGallery
  from "../../features/product/components/CollectionDetails/StampImageCollectionGallery";
import type {Product} from "../../features/product/types/product";
import productData from "../../features/product/data/productData.json";
import {Link} from "react-router-dom";
import React from "react";
import NoSearchResults from "../../features/product/components/NoSearchResults";

export default function CollectionPage({searchTerm}: { searchTerm: string }) {
  const collectionProducts: Product[] = productData;
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