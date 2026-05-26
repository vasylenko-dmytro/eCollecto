import { useAuth } from '../hooks/useAuth';

export function UserMenu() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 dark:text-gray-300">
        {user?.name ?? user?.email}
      </span>
      <button
        onClick={() => signOut()}
        className="px-3 py-1 text-sm bg-gray-200 dark:bg-neutral-600 rounded hover:bg-gray-300 transition"
      >
        Sign out
      </button>
    </div>
  );
}

