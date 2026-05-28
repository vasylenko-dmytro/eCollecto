import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { RootState } from '../../app/store';

interface StatCardProps {
  icon: string;
  label: string;
  count: number;
  to: string;
}

function StatCard({ icon, label, count, to }: StatCardProps) {
  return (
    <Link
      to={to}
      className="bg-neutral-800 rounded-xl p-6 flex flex-col items-center text-center hover:bg-neutral-700 transition-colors"
    >
      <span className="text-3xl mb-2">{icon}</span>
      <span className="text-3xl font-bold text-white">{count}</span>
      <span className="text-gray-400 text-sm mt-1">{label}</span>
    </Link>
  );
}

interface NavCardProps {
  to: string;
  icon: string;
  title: string;
  desc: string;
}

function NavCard({ to, icon, title, desc }: NavCardProps) {
  return (
    <Link
      to={to}
      className="bg-neutral-800 rounded-xl p-6 hover:bg-neutral-700 transition-colors group"
    >
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="text-white font-semibold mb-1 group-hover:text-yellow-400 transition-colors">
        {title}
      </h3>
      <p className="text-gray-400 text-sm">{desc}</p>
    </Link>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const collectionIds = useSelector((state: RootState) => state.collection.stampIds);
  const wishlistIds   = useSelector((state: RootState) => state.wishlist.stampIds);
  const favoriteIds   = useSelector((state: RootState) => state.favorites.stampIds);

  return (
    <div className="max-w-340 px-4 sm:px-6 lg:px-8 py-12 mx-auto">

      {/* User header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white">
          {user?.name ?? 'My Profile'}
        </h1>
        {user?.email && (
          <p className="text-gray-400 mt-1">{user.email}</p>
        )}
      </div>

      {/* Stat widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard icon="📦" label="In Collection" count={collectionIds.length} to="/me/collection" />
        <StatCard icon="⭐" label="On Wishlist"   count={wishlistIds.length}   to="/me/wishlist"   />
        <StatCard icon="♥"  label="Favorites"     count={favoriteIds.length}   to="/me/favorites"  />
      </div>

      {/* Quick-nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <NavCard
          to="/me/collection"
          icon="📦"
          title="My Collection"
          desc="Browse every stamp you've added to your personal album."
        />
        <NavCard
          to="/me/wishlist"
          icon="⭐"
          title="Wishlist"
          desc="Stamps you want to acquire — keep track of future additions."
        />
        <NavCard
          to="/me/favorites"
          icon="♥"
          title="Favorites"
          desc="Your most-loved stamps, always one click away."
        />
      </div>

      {/* Edit profile placeholder */}
      <div>
        <button
          type="button"
          disabled
          className="px-4 py-2 border border-gray-600 text-gray-500 rounded cursor-not-allowed text-sm"
          title="Coming soon"
        >
          Edit Profile (coming soon)
        </button>
      </div>
    </div>
  );
}

