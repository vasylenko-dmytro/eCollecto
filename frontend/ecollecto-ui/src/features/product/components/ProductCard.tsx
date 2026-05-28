import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Product } from '../types/product';
import defaultImg from '@/assets/images/default.png';
import {formatStampValue} from "../../../shared/utils/stampHelpers";
import { useAuth } from '../../auth/hooks/useAuth';
import type { RootState, AppDispatch } from '../../../app/store';
import { addToCollection, removeFromCollection } from '@/features/collection/collectionSlice';
import { addToWishlist, removeFromWishlist } from '@/features/wishlist/wishlistSlice';
import { addToFavorites, removeFromFavorites } from '@/features/favorites/favoritesSlice';

export default function ProductGrid({ product }: { product: Product }) {
  const [formattedDenomination, setFormattedDenomination] = useState("N/A");
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useAuth();

  const stampId = product.stamp_id;
  const isInCollection = useSelector((state: RootState) => state.collection.stampIds.includes(stampId));
  const isInWishlist   = useSelector((state: RootState) => state.wishlist.stampIds.includes(stampId));
  const isInFavorites  = useSelector((state: RootState) => state.favorites.stampIds.includes(stampId));

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

      <div className="mt-auto flex flex-col gap-2">
        {/* Action icon row — authenticated users only */}
        {isAuthenticated && (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              aria-label={isInCollection ? "Remove from collection" : "Add to collection"}
              onClick={(e) => {
                e.stopPropagation();
                if (isInCollection) {
                  dispatch(removeFromCollection(stampId));
                } else {
                  dispatch(addToCollection(stampId));
                }
              }}
              className="size-8 flex items-center justify-center rounded-full border border-gray-300 dark:border-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-700 transition text-lg leading-none"
              title={isInCollection ? "Remove from collection" : "Add to collection"}
            >
              <span className={isInCollection ? "text-green-500" : "text-gray-400"}>✓</span>
            </button>

            <button
              type="button"
              aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              onClick={(e) => {
                e.stopPropagation();
                if (isInWishlist) {
                  dispatch(removeFromWishlist(stampId));
                } else {
                  dispatch(addToWishlist(stampId));
                }
              }}
              className="size-8 flex items-center justify-center rounded-full border border-gray-300 dark:border-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-700 transition text-lg leading-none"
              title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <span className={isInWishlist ? "text-yellow-400" : "text-gray-400"}>★</span>
            </button>

            <button
              type="button"
              aria-label={isInFavorites ? "Remove from favorites" : "Save as favorite"}
              onClick={(e) => {
                e.stopPropagation();
                if (isInFavorites) {
                  dispatch(removeFromFavorites(stampId));
                } else {
                  dispatch(addToFavorites(stampId));
                }
              }}
              className="size-8 flex items-center justify-center rounded-full border border-gray-300 dark:border-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-700 transition text-lg leading-none"
              title={isInFavorites ? "Remove from favorites" : "Save as favorite"}
            >
              <span className={isInFavorites ? "text-red-500" : "text-gray-400"}>♥</span>
            </button>
          </div>
        )}

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
