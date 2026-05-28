import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../app/store';
import { fetchStampById } from '../../shared/api/stampsApi';
import { ProductSchema } from '../../features/product/types/schemas/product.schema';
import type { Product } from '../../features/product/types/product';
import { addToCollection } from '../../features/collection/collectionSlice';
import { removeFromWishlist } from '../../features/wishlist/wishlistSlice';
import { EmptyState } from '../../shared/ui/EmptyState';
import defaultImg from '@/assets/images/default.png';

function WishlistCard({
  product,
  onMoveToCollection,
  onRemove,
  isMutating,
}: {
  product: Product;
  onMoveToCollection: () => void;
  onRemove: () => void;
  isMutating: boolean;
}) {
  return (
    <div className="bg-neutral-800 rounded-xl overflow-hidden flex flex-col">
      <div className="aspect-square bg-neutral-900 overflow-hidden">
        <img
          src={product.images.small}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain p-3 drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
          onError={(e) => { e.currentTarget.src = defaultImg; e.currentTarget.onerror = null; }}
        />
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-white text-xs font-medium line-clamp-2 mb-1">{product.name}</p>
        <p className="text-gray-400 text-xs mb-3">{product.release.year}</p>
        <div className="mt-auto flex gap-2">
          <button
            type="button"
            onClick={onMoveToCollection}
            disabled={isMutating}
            className="flex-1 text-xs py-1.5 bg-yellow-400 text-black font-medium rounded hover:bg-yellow-300 disabled:opacity-50 transition-colors"
          >
            + Collect
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={isMutating}
            aria-label="Remove from wishlist"
            className="px-2 py-1.5 text-gray-400 hover:text-red-400 disabled:opacity-50 transition-colors text-sm"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const dispatch   = useDispatch<AppDispatch>();
  const stampIds   = useSelector((state: RootState) => state.wishlist.stampIds);
  const wlStatus   = useSelector((state: RootState) => state.wishlist.status);

  const [stamps,    setStamps]    = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mutating,  setMutating]  = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (wlStatus === 'loading') return;

    setIsLoading(true);
    const controller = new AbortController();

    const load = async () => {
      try {
        if (stampIds.length === 0) {
          setStamps([]);
          return;
        }
        const raw = await Promise.all(stampIds.map(id => fetchStampById(id, controller.signal)));
        setStamps(ProductSchema.array().parse(raw));
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [stampIds, wlStatus]);

  const handleMoveToCollection = async (stampId: string) => {
    setMutating(m => ({ ...m, [stampId]: true }));
    await dispatch(addToCollection(stampId));
    await dispatch(removeFromWishlist(stampId));
    setMutating(m => ({ ...m, [stampId]: false }));
  };

  const handleRemove = async (stampId: string) => {
    setMutating(m => ({ ...m, [stampId]: true }));
    await dispatch(removeFromWishlist(stampId));
    setMutating(m => ({ ...m, [stampId]: false }));
  };

  if (wlStatus === 'loading' || isLoading) {
    return (
      <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-12 mx-auto">
        <div className="text-gray-400 text-sm">Loading wishlist…</div>
      </div>
    );
  }

  if (stampIds.length === 0) {
    return (
      <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-12 mx-auto">
        <EmptyState
          icon="⭐"
          title="Your wishlist is empty"
          description="Browse the catalog and save stamps you'd like to add to your collection."
          ctaLabel="Explore Catalog"
          ctaTo="/stamps"
        />
      </div>
    );
  }

  return (
    <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-12 mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Wishlist</h1>
        <p className="text-gray-400 text-sm mt-1">{stampIds.length} stamp{stampIds.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stamps.map(stamp => (
          <WishlistCard
            key={stamp.stamp_id}
            product={stamp}
            isMutating={Boolean(mutating[stamp.stamp_id])}
            onMoveToCollection={() => handleMoveToCollection(stamp.stamp_id)}
            onRemove={() => handleRemove(stamp.stamp_id)}
          />
        ))}
      </div>
    </div>
  );
}



