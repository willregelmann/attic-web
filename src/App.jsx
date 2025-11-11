import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FilterProvider } from './contexts/FilterContext';
import { CollectionFilterProvider } from './contexts/CollectionFilterContext';
import { BreadcrumbsProvider } from './contexts/BreadcrumbsContext';
import client from './apolloClient';
import Navigation from './components/Navigation';
import LoginModal from './components/LoginModal';
import MobileSearch from './components/MobileSearch';
import LandingPage from './components/LandingPage';
import CollectionView from './components/CollectionView';
import UserProfile from './components/UserProfile';
import WishlistView from './components/WishlistView';
import MyCollection from './components/MyCollection';
import ItemDetailPage from './components/ItemDetailPage';
import MyItemDetailPage from './components/MyItemDetailPage';
import CircularMenu from './components/CircularMenu';
import './App.css';

// Get Google Client ID from environment variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Inner component that can use auth context
function AppContent() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleSignup = () => {
    // For now, signup and login use the same Google OAuth flow
    setShowLoginModal(true);
  };

  const handleSearchFromMenu = () => {
    setShowMobileSearch(true);
  };

  const handleAccountClick = () => {
    if (isAuthenticated) {
      navigate('/profile');
    } else {
      setShowLoginModal(true);
    }
  };

  // Build context-aware actions for CircularMenu
  const getCircularMenuActions = () => {
    const actions = [];

    // Context-specific actions based on route
    const isMyCollection = location.pathname.startsWith('/my-collection');
    const isCollectionView = location.pathname.startsWith('/collection/');
    const isItemDetail = location.pathname.startsWith('/item/');
    const isMyItemDetail = location.pathname.startsWith('/my-item/');

    // MyCollection, CollectionView, and ItemDetail pages have their own CircularMenus
    // Only show CircularMenu on other pages
    if (!isMyCollection && !isCollectionView && !isItemDetail && !isMyItemDetail) {
      // Search is available on other pages
      actions.push({
        id: 'search',
        icon: 'fas fa-search',
        label: 'Search',
        onClick: handleSearchFromMenu
      });
    }

    return actions;
  };

  return (
    <BreadcrumbsProvider>
      <div className="app">
        <Navigation
          onLogin={handleLogin}
          onSignup={handleSignup}
        />

        <main className="app-content">
          <Routes>
            <Route
              path="/"
              element={isAuthenticated ? <Navigate to="/my-collection" replace /> : <LandingPage />}
            />
            <Route path="/collection/:id" element={<CollectionView />} />
            <Route path="/my-collection/:id?" element={<MyCollection />} />
            <Route path="/item/:entity_id" element={<ItemDetailPage />} />
            <Route path="/my-item/:user_item_id" element={<MyItemDetailPage />} />
            <Route path="/wishlist" element={<WishlistView />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />

        <MobileSearch
          isOpen={showMobileSearch}
          onClose={() => setShowMobileSearch(false)}
        />

        {/* Mobile Circular Menu - context-aware actions */}
        {/* Only render on pages without their own CircularMenu (MyCollection and CollectionView have their own) */}
        {getCircularMenuActions().length > 0 && (
          <CircularMenu
            actions={getCircularMenuActions()}
            onBackdropClick={() => setShowMobileSearch(false)}
          />
        )}
      </div>
    </BreadcrumbsProvider>
  );
}

// Main App component that provides routing context
function App() {
  // Core providers (always needed)
  const coreProviders = (
    <ApolloProvider client={client}>
      <ThemeProvider>
        <FilterProvider>
          <CollectionFilterProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </CollectionFilterProvider>
        </FilterProvider>
      </ThemeProvider>
    </ApolloProvider>
  );

  // Conditionally wrap with GoogleOAuthProvider only if client ID is configured
  if (GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {coreProviders}
      </GoogleOAuthProvider>
    );
  }

  // Run without Google OAuth if not configured
  return coreProviders;
}

export default App;