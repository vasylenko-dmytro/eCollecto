import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.name ?? user?.email ?? 'Account';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      {/* Avatar button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
        aria-label="User menu"
        aria-expanded={open}
      >
        <span className="size-8 flex items-center justify-center rounded-full bg-yellow-400 text-black text-xs font-semibold select-none">
          {initials}
        </span>
        <span className="hidden md:block text-sm text-gray-700 dark:text-gray-200 max-w-30 truncate">
          {displayName}
        </span>
        <svg className="size-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute end-0 mt-2 w-48 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 dark:border-neutral-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{displayName}</p>
          </div>

          <nav className="py-1" onClick={() => setOpen(false)}>
            <Link
              to="/me"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
            >
              👤 My Profile
            </Link>
            <Link
              to="/me/collection"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
            >
              📦 My Collection
            </Link>
            <Link
              to="/me/wishlist"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
            >
              ★ Wishlist
            </Link>
            <Link
              to="/me/favorites"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
            >
              ♥ Favorites
            </Link>
          </nav>

          <div className="border-t border-gray-100 dark:border-neutral-700 py-1">
            <button
              type="button"
              onClick={() => { setOpen(false); signOut(); }}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

