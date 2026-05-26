import { useAuth } from '../hooks/useAuth';

export function LoginButton() {
  const { signIn } = useAuth();
  return (
    <button
      onClick={() => signIn()}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
    >
      Sign in
    </button>
  );
}

