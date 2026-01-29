import React from 'react';
import { Product } from '../types/product';
import defaultImg from '@/assets/images/default.png';
import {formatStampValue} from "../../../shared/utils/stampHelpers";

export default function ProductGrid({ product }: { product: Product }) {

  return (
    <div className="group flex flex-col">
      <div className="relative">
        <div className="aspect-square bg-gray-300 rounded-xl overflow-hidden">
          <img
            className="w-full h-full object-contain p-4"
            src={product.images.small}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = defaultImg;
              e.currentTarget.onerror = null;
            }}
          />
        </div>

        <div className="pt-4">
          <h3 className="font-medium md:text-lg text-black dark:text-white">
            {product.name}
          </h3>
        </div>

        <a className="after:absolute after:inset-0 after:z-1" href="#"></a>
      </div>

      <div className="mb-2 mt-4 text-sm">
        {/* List */}
        <div className="flex flex-col">
          {/* Item */}
          <div className="py-3 border-t border-gray-300 dark:border-neutral-900">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium text-black dark:text-white">Denomination:</span>
              </div>

              <div className="text-end">
                <span className="text-black dark:text-white">{formatStampValue(product.meta.denomination)}</span>
              </div>
            </div>
          </div>
          {/* End Item */}

          {/* Item */}
          <div className="py-3 border-t border-gray-300 dark:border-neutral-900">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium text-black dark:text-white">SKU:</span>
              </div>

              <div className="flex justify-end">
                <span className="text-black dark:text-white">{product.stampSKU}</span>
              </div>
            </div>
          </div>
          {/* End Item */}

          {/* Item */}
          <div className="py-3 border-t border-gray-300 dark:border-neutral-900">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium text-black dark:text-white">Year:</span>
              </div>

              <div className="text-end">
                <span className="text-black dark:text-white">{product.release.year}</span>
              </div>
            </div>
          </div>
          {/* End Item */}
        </div>
        {/* End List */}
      </div>

      <div className="mt-auto">
        <a
          className="py-2 px-3 w-full inline-flex justify-center items-center gap-x-2 text-sm font-medium text-nowrap rounded-xl border border-transparent bg-yellow-400 text-black hover:bg-yellow-500 focus:outline-hidden focus:bg-yellow-500 transition disabled:opacity-50 disabled:pointer-events-none"
          href="#">
          Details
        </a>
      </div>
    </div>
  );
}