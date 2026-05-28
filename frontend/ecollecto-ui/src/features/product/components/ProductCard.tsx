import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types/product';
import defaultImg from '@/assets/images/default.png';
import {formatStampValue} from "../../../shared/utils/stampHelpers";

export default function ProductGrid({ product }: { product: Product }) {
  const [formattedDenomination, setFormattedDenomination] = useState("N/A");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    formatStampValue(product.meta.denomination).then((value) => {
      if (active) {
        setFormattedDenomination(value);
      }
    });

    return () => {
      active = false;
    };
  }, [product.meta.denomination]);

  return (
    <div className="group flex flex-col">
      <div className="relative">
        <div className="aspect-square bg-neutral-800 rounded-xl overflow-hidden">
          <img
            className="w-full h-full object-contain p-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
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
      </div>

      <div className="mb-2 mt-4 text-sm">
        <div className="flex flex-col">
          <div className="py-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400">Denomination:</span>
              </div>
              <div className="text-end">
                <span className="text-white font-medium">{formattedDenomination}</span>
              </div>
            </div>
          </div>

          <div className="py-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400">SKU:</span>
              </div>
              <div className="flex justify-end">
                <span className="text-white font-medium">{product.stampSKU}</span>
              </div>
            </div>
          </div>

          <div className="py-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400">Year:</span>
              </div>
              <div className="text-end">
                <span className="text-white font-medium">{product.release.year}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <button
          type="button"
          onClick={() => navigate(`/stamps/${product.stamp_id}`)}
          className="py-2 px-3 w-full inline-flex justify-center items-center gap-x-2 text-sm font-medium text-nowrap rounded-xl border border-transparent bg-yellow-400 text-black hover:bg-yellow-500 focus:outline-hidden focus:bg-yellow-500 transition disabled:opacity-50 disabled:pointer-events-none"
        >
          Details
        </button>
      </div>
    </div>
  );
}
