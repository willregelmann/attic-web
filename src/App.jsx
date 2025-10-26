import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { BreadcrumbsProvider } from './contexts/BreadcrumbsContext';
import client from './apolloClient';
import Navigation from './components/Navigation';
import LoginModal from './components/LoginModal';
import AddItemsModal from './components/AddItemsModal';
import MobileSearch from './components/MobileSearch';
import LandingPage from './components/LandingPage';
import CollectionView from './components/CollectionView';
import ItemView from './components/ItemView';
import UserProfile from './components/UserProfile';
import WishlistView from './components/WishlistView';
import CircularMenu from './components/CircularMenu';
import './App.css';

// Get Google Client ID from environment variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleSignup = () => {
    // For now, signup and login use the same Google OAuth flow
    setShowLoginModal(true);
  };

  const handleAddToCollection = () => {
    setShowAddItemsModal(true);
  };

  const handleSearchFromMenu = () => {
    setShowMobileSearch(true);
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ApolloProvider client={client}>
        <ThemeProvider>
          <AuthProvider>
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
                    <Route path="/collection/:id" element={<CollectionView />} />
                    <Route path="/item/:id" element={<ItemView />} />
                    <Route path="/wishlist" element={<WishlistView />} />
                    <Route path="/profile" element={<UserProfile />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>

                <AddItemsModal
                  isOpen={showAddItemsModal}
                  onClose={() => setShowAddItemsModal(false)}
                  onItemsAdded={() => {
                    setShowAddItemsModal(false);
                    // Refresh will be handled by the modal itself
                  }}
                />

                <LoginModal
                  isOpen={showLoginModal}
                  onClose={() => setShowLoginModal(false)}
                />

                <MobileSearch
                  isOpen={showMobileSearch}
                  onClose={() => setShowMobileSearch(false)}
                />

                {/* Mobile Circular Menu */}
                <CircularMenu
                  onAddToCollection={handleAddToCollection}
                  onSearch={handleSearchFromMenu}
                  onBackdropClick={() => setShowMobileSearch(false)}
                />
              </div>
            </BreadcrumbsProvider>
          </AuthProvider>
        </ThemeProvider>
      </ApolloProvider>
    </GoogleOAuthProvider>
  );
}

export default App;