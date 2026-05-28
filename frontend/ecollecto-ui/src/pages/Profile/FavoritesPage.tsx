import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../app/store';
import { fetchStampById } from '../../shared/api/stampsApi';
import { ProductSchema } from '../../features/product/types/schemas/product.schema';
import type { Product } from '../../features/product/types/product';
import { removeFromFavorites } from '../../features/favorites/favoritesSlice';
import { EmptyState } from '../../shared/ui/EmptyState';
import defaultImg from '@/assets/images/default.png';
import { Link } from 'react-router-dom';

function FavoriteCard({
  product,
  onRemove,
  isMutating,
}: {
  product: Product;
  onRemove: () => void;
  isMutating: boolean;
}) {
  return (
    <div className="bg-neutral-800 rounded-xl overflow-hidden flex flex-col">
      <div className="relative">
        <div className="aspect-square bg-neutral-900 overflow-hidden">
          <Link to={`/stamps/${product.stamp_id}`}>
            <img
              src={product.images.small}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-contain p-3 drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
              onError={(e) => { e.currentTarget.src = defaultImg; e.currentTarget.onerror = null; }}
            />
          </Link>
        </div>
        {/* Heart remove button overlaid on image */}
        <button
          type="button"
          onClick={onRemove}
          disabled={isMutating}
          aria-label="Remove from favorites"
          className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-red-400 hover:text-red-300 hover:bg-black/80 disabled:opacity-50 transition-colors leading-none"
        >
          ♥
        </button>
      </div>
      <div className="p-3">
        <Link to={`/stamps/${product.stamp_id}`}>
          <p className="text-white text-xs font-medium line-clamp-2 hover:text-yellow-400 transition-colors">
            {product.name}
          </p>
        </Link>
        <p className="text-gray-400 text-xs mt-1">{product.release.year}</p>
      </div>
    </div>
  );
}

export default function FavoritesPage() {
  const dispatch   = useDispatch<AppDispatch>();
  const stampIds   = useSelector((state: RootState) => state.favorites.stampIds);
  const favStatus  = useSelector((state: RootState) => state.favorites.status);

  const [stamps,    setStamps]    = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mutating,  setMutating]  = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (favStatus === 'loading') return;

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
  }, [stampIds, favStatus]);

  const handleRemove = async (stampId: string) => {
    setMutating(m => ({ ...m, [stampId]: true }));
    await dispatch(removeFromFavorites(stampId));
    setMutating(m => ({ ...m, [stampId]: false }));
  };

  if (favStatus === 'loading' || isLoading) {
    return (
      <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-12 mx-auto">
        <div className="text-gray-400 text-sm">Loading favorites…</div>
      </div>
    );
  }

  if (stampIds.length === 0) {
    return (
      <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-12 mx-auto">
        <EmptyState
          icon="♥"
          title="No favorites yet"
          description="Heart a stamp on its detail page to save it here for quick access."
          ctaLabel="Explore Catalog"
          ctaTo="/stamps"
        />
      </div>
    );
  }

  return (
    <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-12 mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Favorites</h1>
        <p className="text-gray-400 text-sm mt-1">{stampIds.length} stamp{stampIds.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stamps.map(stamp => (
          <FavoriteCard
            key={stamp.stamp_id}
            product={stamp}
            isMutating={Boolean(mutating[stamp.stamp_id])}
            onRemove={() => handleRemove(stamp.stamp_id)}
          />
        ))}
      </div>
    </div>
  );
}



