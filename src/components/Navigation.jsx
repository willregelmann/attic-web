import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useBreadcrumbs } from '../contexts/BreadcrumbsContext';
import { useLazyQuery } from '@apollo/client/react';
import { SEMANTIC_SEARCH_DATABASE_OF_THINGS } from '../queries';
import { isCollectionType, formatEntityType } from '../utils/formatters';
import Breadcrumbs from './Breadcrumbs';
import './Navigation.css';

function Navigation({ onLogin, onSignup, onAddToCollection }) {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { breadcrumbItems, loading: breadcrumbsLoading } = useBreadcrumbs();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
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

  const handleLogout = () => {
    logout();
    setShowMenu(false);
  };

  const handleAddToCollection = () => {
    setShowMenu(false);
    if (onAddToCollection) {
      onAddToCollection();
    }
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
      // For individual items, navigate to their parent collection
      // This would need to be implemented based on your needs
      navigate(`/item/${item.id}`);
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
          <span className="nav-title">Will's Attic</span>
        </button>

        <div className="nav-search" ref={searchRef}>
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
            <div className="search-results" role="listbox" aria-label="Search results">
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
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
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
                                style={{ display: item.image_url ? 'none' : 'flex' }}
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
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 1v6m0 6v6M23 12h-6m-6 0H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
              className="nav-menu-button"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Menu"
            >
              {showMenu ? (
                <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                  <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </button>

            {showMenu && (
              <div className="nav-dropdown-menu" role="menu" aria-label="User menu">
                {user ? (
                  <>
                    <div className="dropdown-header" role="presentation">
                      <div className="dropdown-user-info">
                        {user.picture ? (
                          <img
                            src={user.picture}
                            alt={user.name}
                            className="dropdown-avatar"
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                            referrerPolicy="no-referrer"
                          />
                        ) : null}
                        <div
                          className="dropdown-avatar-fallback"
                          style={{ display: user.picture ? 'none' : 'flex' }}
                        >
                          {(user.given_name || user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="dropdown-user-text">
                          <div className="dropdown-username">{user.given_name || user.name}</div>
                          <div className="dropdown-email">{user.email}</div>
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-divider" role="separator"></div>
                    <button
                      className="dropdown-item"
                      onClick={handleAddToCollection}
                      role="menuitem"
                    >
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Add to My Collection
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/wishlist');
                        setShowMenu(false);
                      }}
                      role="menuitem"
                    >
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                      My Wishlist
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/profile');
                        setShowMenu(false);
                      }}
                      role="menuitem"
                    >
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Profile & API Tokens
                    </button>
                    <div className="dropdown-divider" role="separator"></div>
                    <button className="dropdown-item" onClick={handleLogout} role="menuitem">
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <button className="dropdown-item dropdown-item-primary" onClick={onLogin} role="menuitem">
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden="true">
                        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Log In
                    </button>
                    <button className="dropdown-item" onClick={onSignup} role="menuitem">
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden="true">
                        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6"
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
    {breadcrumbItems.length > 0 && (
      <Breadcrumbs items={breadcrumbItems} loading={breadcrumbsLoading} />
    )}
    </>
  );
}

export default Navigation;