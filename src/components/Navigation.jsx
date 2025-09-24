import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLazyQuery } from '@apollo/client/react';
import { SEARCH_ITEMS } from '../queries';
import './Navigation.css';

function Navigation({ onLogin, onSignup }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const [searchItems, { data: searchData, loading: searchLoading }] = useLazyQuery(
    SEARCH_ITEMS,
    {
      onCompleted: (data) => {
        console.log('Search completed:', data);
        setShowSearchResults(true);
      },
      onError: (error) => {
        console.error('Search error:', error);
      }
    }
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
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
    setShowDropdown(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchItems({ variables: { name: searchQuery } });
    }
  };

  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    console.log('Search input changed:', query);
    setSearchQuery(query);
    if (query.length > 2) {
      console.log('Triggering search for:', query);
      setShowSearchResults(true); // Show results immediately when typing
      searchItems({ variables: { name: query } });
    } else {
      setShowSearchResults(false);
    }
  };

  const handleResultClick = (item) => {
    setShowSearchResults(false);
    setSearchQuery('');

    if (item.type === 'COLLECTION' || item.type === 'collection') {
      navigate(`/collection/${item.id}`);
    } else {
      // For individual items, navigate to their parent collection
      // This would need to be implemented based on your needs
      navigate(`/item/${item.id}`);
    }
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <button className="nav-brand" onClick={handleLogoClick}>
          <div className="nav-logo">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="14" r="2" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <span className="nav-title">Attic</span>
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

          {console.log('Render check:', { showSearchResults, searchQuery, searchData, searchLoading })}
          {showSearchResults && searchQuery && (
            <div className="search-results">
              {searchLoading && (
                <div className="search-loading">Searching...</div>
              )}
              {!searchLoading && searchData?.searchItems && (
                <>
                  {searchData.searchItems.length === 0 ? (
                    <div className="search-empty">No results found</div>
                  ) : (
                    <>
                      <div className="search-results-header">
                        Found {searchData.searchItems.length} result{searchData.searchItems.length !== 1 ? 's' : ''}
                      </div>
                      <div className="search-results-list">
                        {searchData.searchItems.map(item => (
                          <button
                            key={item.id}
                            className="search-result-item"
                            onClick={() => handleResultClick(item)}
                          >
                            <div className="search-result-type">
                              {item.type === 'COLLECTION' || item.type === 'collection' ? '📦' : '🎴'}
                            </div>
                            <div className="search-result-details">
                              <div className="search-result-name">{item.name}</div>
                              <div className="search-result-meta">
                                {item.type === 'COLLECTION' || item.type === 'collection' ? 'Collection' : 'Item'}
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
          {user ? (
            <div className="nav-user-dropdown" ref={dropdownRef}>
              <button
                className="nav-user-button"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span className="nav-username">{user.given_name || user.name}</span>
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="nav-avatar-img"
                    onError={(e) => {
                      console.error('Failed to load avatar:', user.picture);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <div
                  className="nav-avatar"
                  style={{ display: user.picture ? 'none' : 'flex' }}
                >
                  {(user.given_name || user.name || 'U').charAt(0).toUpperCase()}
                </div>
                <svg
                  className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  width="16"
                  height="16"
                >
                  <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {showDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div className="dropdown-email">{user.email}</div>
                  </div>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="nav-btn nav-btn-primary" onClick={onLogin}>
              Log In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;