import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useBreadcrumbs } from '../contexts/BreadcrumbsContext';
import { useSearch } from '../contexts/SearchContext';
import { useLazyQuery } from '@apollo/client/react';
import { SEMANTIC_SEARCH_DATABASE_OF_THINGS } from '../queries';
import { isCollectionType, formatEntityType } from '../utils/formatters';
import Breadcrumbs from './Breadcrumbs';
import EntityDetailModal from './EntityDetailModal';
import MobileMenuPanel from './MobileMenuPanel';
import { ImageSearchModal } from './ImageSearchModal';

// Get Google Client ID from environment variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function Navigation() {
  const { user, logout, login } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { breadcrumbItems, loading: breadcrumbsLoading } = useBreadcrumbs();
  const { searchMode, setSearchMode } = useSearch();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showImageSearchModal, setShowImageSearchModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  const [searchItems, { data: searchData, loading: searchLoading }] = useLazyQuery(
    SEMANTIC_SEARCH_DATABASE_OF_THINGS,
    {
      fetchPolicy: 'network-only',
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
        searchItems({ variables: { query: searchQuery, first: 10 } });
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
      // Navigate directly to full search page when pressing Enter
      const query = encodeURIComponent(searchQuery);
      setShowSearchResults(false);
      setSearchQuery('');
      navigate(`/search?q=${query}`);
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

    if (isCollectionType(item)) {
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

  const handleViewAllResults = () => {
    const query = encodeURIComponent(searchQuery);
    setShowSearchResults(false);
    navigate(`/search?q=${query}`);
  };

  return (
    <>
      <nav className="bg-[#2C4B7B] sticky top-0 z-[1000] shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
        <div className="py-3 px-4 md:px-6 flex items-center justify-between">
          <button
            className="flex items-center gap-3 md:gap-2 text-white text-xl font-semibold bg-transparent border-none cursor-pointer py-1 px-2 md:p-1 rounded-lg transition-all shrink-0 hover:bg-white/10"
            onClick={handleLogoClick}
          >
            <div className="w-12 h-12 md:w-10 md:h-10 flex items-center justify-center bg-[var(--yellow-accent)] rounded-full font-bold text-2xl md:text-xl">
              <i className="fas fa-briefcase text-2xl md:text-xl text-[#2C4B7B]"></i>
            </div>
            <span className="tracking-tight md:text-lg">
              {user ? `${user.given_name || user.name?.split(' ')[0] || 'My'}'s Attic` : "Will's Attic"}
            </span>
          </button>

          <div className="flex-1 max-w-[500px] mx-8 relative hidden md:block" ref={searchRef}>
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative w-full">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none z-[1]" viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  className="w-full block box-border py-2.5 pr-12 pl-11 bg-white/10 border border-white/20 rounded-lg text-white text-[0.95rem] transition-all placeholder:text-white/50 focus:outline-none focus:bg-white/15 focus:border-white/30"
                  placeholder="Search collections and items..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="absolute right-10 top-1/2 -translate-y-1/2 bg-transparent border-none text-white/60 cursor-pointer p-1.5 flex items-center justify-center rounded transition-all z-[2] hover:text-white hover:bg-white/10"
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
                <button
                  type="button"
                  className={`absolute top-1/2 -translate-y-1/2 bg-transparent border-none text-white/70 cursor-pointer p-2 flex items-center justify-center rounded transition-all z-[1] hover:text-white hover:bg-white/10 ${searchQuery ? 'right-10' : 'right-2.5'}`}
                  onClick={() => setShowImageSearchModal(true)}
                  title="Search by image"
                >
                  <Camera size={18} />
                </button>
              </div>
            </form>

            {showSearchResults && searchQuery && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[var(--bg-primary)] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] max-h-[500px] overflow-hidden flex flex-col z-[1002]" role="listbox" aria-label="Search results" data-testid="search-results">
                {searchLoading && (
                  <div className="p-4 text-center text-[var(--text-secondary)] text-sm" role="status" aria-live="polite">Searching...</div>
                )}
                {!searchLoading && searchData?.databaseOfThingsSemanticSearch && (() => {
                  const searchResults = searchData.databaseOfThingsSemanticSearch?.edges?.map(e => e.node) || [];
                  return (
                    <>
                      {searchResults.length === 0 ? (
                        <div className="p-4 text-center text-[var(--text-secondary)] text-sm">No results found</div>
                      ) : (
                        <>
                          <div className="py-2 overflow-y-auto flex-1 min-h-0" role="group">
                            {searchResults.map(item => (
                              <button
                                key={item.id}
                                className="flex items-center gap-3 w-full py-2.5 px-4 bg-transparent border-none cursor-pointer transition-all text-left hover:bg-[var(--bg-secondary)]"
                                onClick={() => handleResultClick(item)}
                                role="option"
                                aria-label={`${item.name} - ${item.type}`}
                              >
                                <div className="w-10 h-10 shrink-0 relative rounded-md overflow-hidden bg-[var(--bg-secondary)] flex items-center justify-center">
                                  {(item.thumbnail_url || item.image_url || item.representative_image_urls?.[0]) ? (
                                    <img
                                      src={item.thumbnail_url || item.image_url || item.representative_image_urls?.[0]}
                                      alt={item.name}
                                      className="w-full h-full object-contain block"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div
                                    className="w-full h-full text-xl leading-none flex items-center justify-center"
                                    style={{ display: (item.thumbnail_url || item.image_url || item.representative_image_urls?.[0]) ? 'none' : 'flex' }}
                                  >
                                    {isCollectionType(item) ? '📦' : '🎴'}
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="text-[var(--text-primary)] text-[0.95rem] font-medium mb-0.5">{item.name}</div>
                                  <div className="text-[var(--text-secondary)] text-[0.8rem]">
                                    {formatEntityType(item.type)}
                                    {item.year && ` • ${item.year}`}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                          {searchResults.length === 10 && (
                            <button
                              className="block w-full py-3 px-4 bg-[var(--bg-primary)] border-none border-t border-[var(--border-color)] text-[var(--primary)] text-sm font-semibold cursor-pointer transition-all text-center shrink-0 shadow-[0_-2px_8px_rgba(0,0,0,0.05)] hover:bg-[var(--bg-secondary)]"
                              onClick={handleViewAllResults}
                              data-testid="view-all-results"
                            >
                              View all results →
                            </button>
                          )}
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile Hamburger Menu */}
            <button
              className="flex md:hidden bg-white/10 border border-white/20 rounded-lg p-2 text-white cursor-pointer items-center justify-center transition-all w-9 h-9 hover:bg-white/20 hover:border-white/30"
              onClick={() => setShowMobileMenu(true)}
              aria-label="Open menu"
              data-testid="nav-toggle"
            >
              <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <button
                className="bg-white/10 border border-white/20 rounded-lg p-2 text-white cursor-pointer flex items-center justify-center transition-all w-9 h-9 hover:bg-white/20 hover:border-white/30"
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

              <div className="relative" ref={menuRef}>
                <button
                  className="flex items-center justify-center w-9 h-9 bg-transparent border-none text-white cursor-pointer p-0 rounded-full transition-all hover:scale-105"
                  onClick={() => setShowMenu(!showMenu)}
                  aria-label="User menu"
                >
                  {user ? (
                    <>
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                          referrerPolicy="no-referrer"
                        />
                      ) : null}
                      <div
                        className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center font-semibold text-base border-2 border-white/30 shrink-0"
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
                  <div className="absolute top-[calc(100%+8px)] right-0 bg-[var(--bg-primary)] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] min-w-[180px] z-[1001] overflow-hidden" role="menu" aria-label="User menu">
                    {user ? (
                      <button className="flex items-center gap-3 w-full py-3 px-4 bg-transparent border-none text-[var(--text-primary)] text-[0.95rem] cursor-pointer transition-all text-left hover:bg-[var(--bg-secondary)] [&_svg]:text-[var(--text-secondary)] [&_svg]:shrink-0" onClick={handleLogout} role="menuitem">
                        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Log Out
                      </button>
                    ) : GOOGLE_CLIENT_ID ? (
                      <div className="p-2 flex justify-center items-center">
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
                    ) : (
                      <div className="flex items-center gap-3 w-full py-3 px-4 bg-transparent border-none text-[var(--text-primary)] text-[0.95rem] cursor-pointer transition-all text-left">
                        <p>Google Sign-In not configured</p>
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
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />
      {breadcrumbItems.length > 0 && (
        <Breadcrumbs items={breadcrumbItems} loading={breadcrumbsLoading} />
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <EntityDetailModal
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

      {/* Image Search Modal */}
      <ImageSearchModal
        isOpen={showImageSearchModal}
        onClose={() => setShowImageSearchModal(false)}
      />

    </>
  );
}

export default Navigation;
