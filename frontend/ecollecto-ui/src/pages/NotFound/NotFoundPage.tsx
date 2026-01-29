import {Link} from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main id="content">
      <div className="text-center py-10 px-4 sm:px-6 lg:px-8">
        <h1 className="block text-7xl font-bold text-gray-800 sm:text-9xl dark:text-white">404</h1>
        <p className="mt-3 text-gray-600 dark:text-neutral-400">Oops, something went wrong.</p>
        <p className="text-gray-600 dark:text-neutral-400">Sorry, we couldn't find your page.</p>
        <div className="mt-5 flex flex-col justify-center items-center gap-2 sm:flex-row sm:gap-3">
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <div className="flex items-center gap-2 transition-colors cursor-pointer">
              <svg
                className="shrink-0 size-4"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6"/>
              </svg>
              <span className="font-medium text-sm">Back to Home</span>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}