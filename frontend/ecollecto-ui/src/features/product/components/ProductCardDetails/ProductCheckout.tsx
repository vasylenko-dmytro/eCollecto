import {formatStampValue} from "../../../../shared/utils/stampHelpers";
import {Product} from "../../types/product";
import {useEffect, useState} from "react";
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../../../app/store';
import { useAuth } from '../../../auth/hooks/useAuth';
import { addToCollection, removeFromCollection } from '../../../collection/collectionSlice';
import { addToWishlist, removeFromWishlist } from '../../../wishlist/wishlistSlice';
import { addToFavorites, removeFromFavorites } from '../../../favorites/favoritesSlice';

export default function ProductCheckout({ product }: { product: Product }) {
  const [formattedDenomination, setFormattedDenomination] = useState("N/A");

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

  return(
    <div className="md:col-span-3">
      <div className="bg-gray-50 dark:bg-neutral-800 p-6 rounded-3xl border border-gray-200 dark:border-neutral-700 sticky top-24">
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            Denomination:
          </label>
          <div className="w-full p-4 bg-white dark:bg-neutral-900 border-2 border-blue-600 rounded-xl shadow-sm text-center">
            <span className="text-xl font-black text-blue-600 dark:text-blue-400">
              {formattedDenomination}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (isInCollection) {
                    dispatch(removeFromCollection(stampId));
                  } else {
                    dispatch(addToCollection(stampId));
                  }
                }}
                className={`w-full font-bold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                  isInCollection
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-green-700 hover:bg-green-800 text-white'
                }`}
              >
                {isInCollection ? '✓ In Collection' : '+ Add to Collection'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isInWishlist) {
                    dispatch(removeFromWishlist(stampId));
                  } else {
                    dispatch(addToWishlist(stampId));
                  }
                }}
                className={`w-full py-3 rounded-xl transition-all font-semibold text-sm flex items-center justify-center gap-2 border ${
                  isInWishlist
                    ? 'bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400'
                    : 'bg-white dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-600'
                }`}
              >
                {isInWishlist ? '★ On Wishlist' : '★ Add to Wishlist'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isInFavorites) {
                    dispatch(removeFromFavorites(stampId));
                  } else {
                    dispatch(addToFavorites(stampId));
                  }
                }}
                className={`w-full py-3 rounded-xl transition-all font-semibold text-sm flex items-center justify-center gap-2 border ${
                  isInFavorites
                    ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                    : 'bg-white dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-600'
                }`}
              >
                {isInFavorites ? '♥ Saved as Favorite' : '♥ Save as Favorite'}
              </button>
            </>
          ) : (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
              <a href="#" onClick={(e) => e.preventDefault()} className="text-yellow-500 hover:underline font-medium">Sign in</a> to add to your collection
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
