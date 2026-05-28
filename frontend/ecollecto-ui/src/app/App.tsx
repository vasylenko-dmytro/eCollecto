import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header, Footer } from '../features/product/index';
import LandingPage from '../pages/Landing/LandingPage';
import CatalogPage from '../pages/Catalog/CatalogPage';
import YearStampsPage from '../pages/Catalog/YearStampsPage';
import ProductPage from '../pages/Product/ProductPage';
import NotFoundPage from '../pages/NotFound/NotFoundPage';
import CollectionPage from '../pages/Collection/CollectionPage';
import FirstDayPage from '../pages/FirstDay/FirstDayPage';
import ProfilePage from '../pages/Profile/ProfilePage';
import MyCollectionPage from '../pages/Profile/MyCollectionPage';
import WishlistPage from '../pages/Profile/WishlistPage';
import FavoritesPage from '../pages/Profile/FavoritesPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminRoute } from './routes/AdminRoute';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-neutral-700 transition-colors duration-300">
        <Header onSearch={setSearchTerm} />
        <main className="flex-1">
          <Routes>
            {/* ── Public routes ── */}
            <Route path="/"                   element={<LandingPage />} />
            <Route path="/stamps"             element={<CatalogPage searchTerm={searchTerm} />} />
            <Route path="/stamps/year/:year"  element={<YearStampsPage searchTerm={searchTerm} />} />
            <Route path="/stamps/:id"         element={<ProductPage />} />
            <Route path="/collection"         element={<CollectionPage searchTerm={searchTerm} />} />
            <Route path="/firstday"           element={<FirstDayPage searchTerm={searchTerm} />} />

            {/* ── Protected routes (ROLE_USER) ── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/me"             element={<ProfilePage />} />
              <Route path="/me/collection"  element={<MyCollectionPage />} />
              <Route path="/me/wishlist"    element={<WishlistPage />} />
              <Route path="/me/favorites"   element={<FavoritesPage />} />
            </Route>

            {/* ── Admin routes (ROLE_ADMIN) ── */}
            <Route element={<AdminRoute />}>
              {/* Block B: <Route path="/admin" element={<AdminPage />} /> */}
            </Route>

            <Route path="/forbidden" element={<div className="p-8 text-center text-red-500">403 — Access Denied</div>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
