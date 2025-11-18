import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FilterProvider } from './contexts/FilterContext';
import { CollectionFilterProvider } from './contexts/CollectionFilterContext';
import { BreadcrumbsProvider } from './contexts/BreadcrumbsContext';
import { SearchProvider } from './contexts/SearchContext';
import { RadialMenuProvider, useRadialMenuContext } from './contexts/RadialMenuContext';
import client from './apolloClient';
import Navigation from './components/Navigation';
import MobileSearch from './components/MobileSearch';
import { ImageSearchModal } from './components/ImageSearchModal';
import LandingPage from './components/LandingPage';
import DatabaseOfThingsCollectionPage from './components/DatabaseOfThingsCollectionPage';
import UserCollectionPage from './components/UserCollectionPage';
import DatabaseOfThingsEntityDetailPage from './components/DatabaseOfThingsEntityDetailPage';
import UserEntityDetailPage from './components/UserEntityDetailPage';
import SearchResultsPage from './components/SearchResultsPage';
import RadialMenu from './components/RadialMenu';

// Get Google Client ID from environment variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Inner component that can use auth context
function AppContent() {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showImageSearchModal, setShowImageSearchModal] = useState(false);
  const { isAuthenticated } = useAuth();

  // Get RadialMenu state from context
  const { actions: radialMenuActions, mainButton } = useRadialMenuContext();

  return (
    <BreadcrumbsProvider>
      <div className="min-h-screen flex flex-col">
        <Navigation />

        <main className="flex-1 w-full">
          <Routes>
            <Route
              path="/"
              element={isAuthenticated ? <Navigate to="/my-collection" replace /> : <LandingPage />}
            />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/collection/:id" element={<DatabaseOfThingsCollectionPage />} />
            <Route path="/my-collection/:id?" element={<UserCollectionPage />} />
            <Route path="/item/:entity_id" element={<DatabaseOfThingsEntityDetailPage />} />
            <Route path="/my-item/:user_item_id" element={<UserEntityDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <MobileSearch
          isOpen={showMobileSearch}
          onClose={() => setShowMobileSearch(false)}
          onOpenImageSearch={() => setShowImageSearchModal(true)}
        />

        <ImageSearchModal
          isOpen={showImageSearchModal}
          onClose={() => setShowImageSearchModal(false)}
        />

        {/* Mobile Radial Menu - centralized, controlled via RadialMenuContext */}
        {mainButton ? (
          <RadialMenu mainButton={mainButton} />
        ) : radialMenuActions.length > 0 ? (
          <RadialMenu actions={radialMenuActions} />
        ) : null}
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
          <SearchProvider>
            <CollectionFilterProvider>
              <AuthProvider>
                <RadialMenuProvider>
                  <AppContent />
                </RadialMenuProvider>
              </AuthProvider>
            </CollectionFilterProvider>
          </SearchProvider>
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