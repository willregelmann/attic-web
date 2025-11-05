import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FilterProvider } from './contexts/FilterContext';
import { CollectionFilterProvider } from './contexts/CollectionFilterContext';
import { BreadcrumbsProvider } from './contexts/BreadcrumbsContext';
import client from './apolloClient';
import Navigation from './components/Navigation';
import LoginModal from './components/LoginModal';
import AddItemsModal from './components/AddItemsModal';
import MobileSearch from './components/MobileSearch';
import LandingPage from './components/LandingPage';
import CollectionView from './components/CollectionView';
import UserProfile from './components/UserProfile';
import WishlistView from './components/WishlistView';
import MyCollection from './components/MyCollection';
import CircularMenu from './components/CircularMenu';
import './App.css';

// Get Google Client ID from environment variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Inner component that can use auth context
function AppContent() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [preSelectedItem, setPreSelectedItem] = useState(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Hide global menu on routes that render ItemList (which has its own CircularMenu with filter)
  const showGlobalMenu = !location.pathname.startsWith('/collection') && location.pathname !== '/my-collection';

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleSignup = () => {
    // For now, signup and login use the same Google OAuth flow
    setShowLoginModal(true);
  };

  const handleAddToCollection = (item = null) => {
    setPreSelectedItem(item);
    setShowAddItemsModal(true);
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

  return (
    <BreadcrumbsProvider>
      <div className="app">
        <Navigation
          onLogin={handleLogin}
          onSignup={handleSignup}
          onAddToCollection={handleAddToCollection}
        />

        <main className="app-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/collection/:id" element={<CollectionView onAddToCollection={handleAddToCollection} />} />
            <Route path="/my-collection" element={<MyCollection onAddToCollection={handleAddToCollection} />} />
            <Route path="/wishlist" element={<WishlistView />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <AddItemsModal
          isOpen={showAddItemsModal}
          onClose={() => {
            setShowAddItemsModal(false);
            setPreSelectedItem(null);
          }}
          onItemsAdded={() => {
            setShowAddItemsModal(false);
            setPreSelectedItem(null);
            // Refresh will be handled by the modal itself
          }}
          preSelectedItem={preSelectedItem}
        />

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />

        <MobileSearch
          isOpen={showMobileSearch}
          onClose={() => setShowMobileSearch(false)}
          onAddToCollection={handleAddToCollection}
        />

        {/* Mobile Circular Menu - only on pages without their own menu */}
        {showGlobalMenu && (
          <CircularMenu
            onAddToCollection={handleAddToCollection}
            onSearch={handleSearchFromMenu}
            onAccount={handleAccountClick}
            onBackdropClick={() => setShowMobileSearch(false)}
          />
        )}
      </div>
    </BreadcrumbsProvider>
  );
}

// Main App component that provides routing context
function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
    </GoogleOAuthProvider>
  );
}

export default App;