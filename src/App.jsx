import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import client from './apolloClient';
import Navigation from './components/Navigation';
import LoginModal from './components/LoginModal';
import AddItemsModal from './components/AddItemsModal';
import CollectionView from './components/CollectionView';
import ItemView from './components/ItemView';
import CollectionAdmin from './components/CollectionAdmin';
import './App.css';

// Get Google Client ID from environment variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);

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

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ApolloProvider client={client}>
        <AuthProvider>
          <div className="app">
            <Navigation
              onLogin={handleLogin}
              onSignup={handleSignup}
              onAddToCollection={handleAddToCollection}
            />

            <main className="app-content">
              <Routes>
                <Route path="/" element={<CollectionView />} />
                <Route path="/collection/:id" element={<CollectionView />} />
                <Route path="/item/:id" element={<ItemView />} />
                <Route path="/admin" element={<CollectionAdmin />} />
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
          </div>
        </AuthProvider>
      </ApolloProvider>
    </GoogleOAuthProvider>
  );
}

export default App;