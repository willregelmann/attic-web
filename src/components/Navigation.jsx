import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useBreadcrumbs } from '../contexts/BreadcrumbsContext';
import { useLazyQuery } from '@apollo/client/react';
import { SEMANTIC_SEARCH_DATABASE_OF_THINGS } from '../queries';
import { isCollectionType, formatEntityType } from '../utils/formatters';
import Breadcrumbs from './Breadcrumbs';
import ItemDetail from './ItemDetail';
import MobileMenuPanel from './MobileMenuPanel';
import './Navigation.css';

function Navigation({ onLogin, onSignup }) {
  const { user, logout, login } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { breadcrumbItems, loading: breadcrumbsLoading } = useBreadcrumbs();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  const [searchItems, { data: searchData, loading: searchLoading }] = useLazyQuery(
    SEMANTIC_SEARCH_DATABASE_OF_THINGS,
    {
      onCompleted: () => {
        setShowSearchResults(true);
      },
      onError: (error) => {
        console.error('Search error:', error);
      }
    }
  );

  // Debounce search input
  useEffect(() => {
    if (searchQuery.length > 2) {
      const timeoutId = setTimeout(() => {
        searchItems({ variables: { query: searchQuery, first: 20 } });
      }, 500); // Wait 500ms after user stops typing

      return () => clearTimeout(timeoutId);
    } else {
      setShowSearchResults(false);
    }
  }, [searchQuery, searchItems]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await login(credentialResponse.credential);
      setShowMenu(false);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
  };

  const handleLogout = async () => {
    await logout();
    setShowMenu(false);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchItems({ variables: { query: searchQuery, first: 20 } });
    }
  };

  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    // Search is now handled by useEffect with debounce
    if (query.length > 2) {
      setShowSearchResults(true); // Show dropdown immediately while loading
    } else {
      setShowSearchResults(false);
    }
  };

  const handleResultClick = (item) => {
    setShowSearchResults(false);
    setSearchQuery('');

    if (isCollectionType(item.type)) {
      navigate(`/collection/${item.id}`);
    } else {
      // For individual items, check viewport
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        // Navigate to full-page view on mobile
        navigate(`/item/${item.id}`);
      } else {
        // Show detail modal on desktop
        setSelectedItem(item);
      }
    }
  };

  return (
    <>
      <nav className="navigation">
        <div className="nav-container">
        <button className="nav-brand" onClick={handleLogoClick}>
          <div className="nav-logo">
            <i className="fas fa-briefcase"></i>
          </div>
          <span className="nav-title">
            {user ? `${user.given_name || user.name?.split(' ')[0] || 'My'}'s Attic` : "Will's Attic"}
          </span>
        </button>

        <div className="nav-search nav-search-desktop" ref={searchRef}>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" width="20" height="20">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search collections and items..."
                value={searchQuery}
                onChange={handleSearchInputChange}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          </form>

          {showSearchResults && searchQuery && (
            <div className="search-results" role="listbox" aria-label="Search results" data-testid="search-results">
              {searchLoading && (
                <div className="search-loading" role="status" aria-live="polite">Searching...</div>
              )}
              {!searchLoading && searchData?.databaseOfThingsSemanticSearch && (
                <>
                  {searchData.databaseOfThingsSemanticSearch.length === 0 ? (
                    <div className="search-empty">No results found</div>
                  ) : (
                    <>
                      <div className="search-results-header">
                        Found {searchData.databaseOfThingsSemanticSearch.length} result{searchData.databaseOfThingsSemanticSearch.length !== 1 ? 's' : ''}
                      </div>
                      <div className="search-results-list" role="group">
                        {searchData.databaseOfThingsSemanticSearch.map(item => (
                          <button
                            key={item.id}
                            className="search-result-item"
                            onClick={() => handleResultClick(item)}
                            role="option"
                            aria-label={`${item.name} - ${item.type}`}
                          >
                            <div className="search-result-image">
                              {(item.thumbnail_url || item.image_url) ? (
                                <img
                                  src={item.thumbnail_url || item.image_url}
                                  alt={item.name}
                                  className="search-result-thumbnail"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                className="search-result-emoji"
                                style={{ display: (item.thumbnail_url || item.image_url) ? 'none' : 'flex' }}
                              >
                                {isCollectionType(item.type) ? '📦' : '🎴'}
                              </div>
                            </div>
                            <div className="search-result-details">
                              <div className="search-result-name">{item.name}</div>
                              <div className="search-result-meta">
                                {formatEntityType(item.type)}
                                {item.year && ` • ${item.year}`}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="nav-actions">
          {/* Mobile Hamburger Menu */}
          <button
            className="mobile-menu-button"
            onClick={() => setShowMobileMenu(true)}
            aria-label="Open menu"
            data-testid="nav-toggle"
          >
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
              <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Desktop Actions */}
          <div className="nav-actions-desktop">
            {/* Dark Mode Toggle */}
            <button
              className="theme-toggle-button"
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                // Sun icon for light mode
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                // Moon icon for dark mode
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            <div className="nav-menu-container" ref={menuRef}>
            <button
              className="nav-user-button"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="User menu"
            >
              {user ? (
                <>
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="nav-user-avatar"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <div
                    className="nav-user-avatar-fallback"
                    style={{ display: user.picture ? 'none' : 'flex' }}
                  >
                    {(user.given_name || user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                </>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            {showMenu && (
              <div className="nav-dropdown-menu" role="menu" aria-label="User menu">
                {user ? (
                  <button className="dropdown-item" onClick={handleLogout} role="menuitem">
                    <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Log Out
                  </button>
                ) : (
                  <div className="google-login-dropdown">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      theme="outline"
                      size="large"
                      text="signin_with"
                      shape="rectangular"
                      width="200"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </nav>

      {/* Mobile Menu Panel*/}
      <MobileMenuPanel
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        user={user}
        onLogin={onLogin}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />
    {breadcrumbItems.length > 0 && (
      <Breadcrumbs items={breadcrumbItems} loading={breadcrumbsLoading} />
    )}

    {/* Item Detail Modal */}
    {selectedItem && (
      <ItemDetail
        item={selectedItem}
        isOwned={false}
        onToggleOwnership={() => {}}
        onNavigateToCollection={(collection) => {
          navigate(`/collection/${collection.id}`);
          setSelectedItem(null);
        }}
        onClose={() => setSelectedItem(null)}
      />
    )}

    </>
  );
}

export default Navigation;