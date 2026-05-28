import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStampsByYear, fetchStampYears } from '../../shared/api/stampsApi';
import { ProductCard } from '../../features/product';
import { ProductSchema } from '../../features/product/types/schemas/product.schema';
import type { Product } from '../../features/product/types/product';
import { useAuth } from 'react-oidc-context';

export default function LandingPage() {
  const auth = useAuth();
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    // Load only the latest year — safe even with 2500 stamps in the database
    fetchStampYears(controller.signal)
      .then(years => {
        if (years.length === 0) return undefined;
        const latestYear = years[0].year; // sorted desc
        return fetchStampsByYear(latestYear, controller.signal);
      })
      .then(raw => {
        if (raw) setFeatured(ProductSchema.array().parse(raw).slice(0, 4));
      })
      .catch(() => {/* featured section is best-effort */});
    return () => controller.abort();
  }, []);

  return (
    <div className="max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
      {/* Hero */}
      <section className="py-24 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Your Digital Haven for Ukrainian Philately
        </h1>
        <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
          Track releases, collect first-day covers, and trace the history behind
          every historic postal release in one interactive application.
        </p>
        <div className="flex gap-4 justify-center">
          {auth.isAuthenticated ? (
            <Link to="/me" className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded hover:bg-yellow-300">
              My Collection
            </Link>
          ) : (
            <button
              onClick={() => auth.signinRedirect()}
              className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded hover:bg-yellow-300"
            >
              Create Account
            </button>
          )}
          <Link to="/stamps" className="px-6 py-3 border border-gray-500 text-white rounded hover:border-yellow-400">
            Explore Catalog
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
        {[
          { icon: '🔍', title: 'Discover', desc: 'Explore the complete catalog of Ukrainian stamps.' },
          { icon: '📁', title: 'Collect', desc: 'Curate your personalized virtual stamp albums.' },
          { icon: '📊', title: 'Track', desc: 'Monitor progress metrics by release year.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="bg-neutral-800 rounded-lg p-8">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
            <p className="text-gray-400 text-sm">{desc}</p>
          </div>
        ))}
      </section>

      {/* Featured Releases */}
      {featured.length > 0 && (
        <section className="py-12">
          <h2 className="text-xl font-bold text-white mb-6">Latest Releases</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featured.map(product => (
              <Link key={product.stamp_id} to={`/stamps/${product.stamp_id}`}
                className="block transition-transform hover:scale-[1.01]">
                <ProductCard product={product} />
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link to="/stamps" className="text-yellow-400 hover:underline">View all years →</Link>
          </div>
        </section>
      )}
    </div>
  );
}

