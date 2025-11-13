import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import './MobileMenuPanel.css';

function MobileMenuPanel({ isOpen, onClose, user, onLogin, onLogout, isDarkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await login(credentialResponse.credential);
      onClose();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
  };

  const handleLogin = () => {
    onLogin();
    onClose();
  };

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="mobile-menu-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-in Panel */}
      <div
        className={`mobile-menu-panel ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
        data-testid="mobile-nav"
      >
        <div className="mobile-menu-header">
          <button
            className="mobile-menu-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="mobile-menu-content">
          {/* User Section - Show avatar/name when logged in */}
          {user && (
            <div className="mobile-menu-user">
              <div className="mobile-menu-user-avatar">
                {user.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="mobile-menu-user-info">
                <div className="mobile-menu-user-name">{user.name}</div>
                <div className="mobile-menu-user-email">{user.email}</div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="mobile-menu-nav">
            {user ? (
              <button
                className="mobile-menu-nav-item"
                onClick={() => handleNavigation('/my-collection')}
              >
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                My Collection
              </button>
            ) : (
              <button
                className="mobile-menu-nav-item"
                onClick={() => handleNavigation('/recently-viewed')}
              >
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Recently Viewed
              </button>
            )}
          </nav>

          {/* Theme Toggle */}
          <div className="mobile-menu-section">
            <button
              className="mobile-menu-toggle-item"
              onClick={toggleDarkMode}
            >
              <div className="mobile-menu-toggle-label">
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  {isDarkMode ? (
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </>
                  )}
                </svg>
                Dark Mode
              </div>
              <div className="mobile-menu-toggle-switch">
                <input
                  type="checkbox"
                  checked={isDarkMode}
                  onChange={toggleDarkMode}
                  className="mobile-menu-toggle-input"
                />
                <span className="mobile-menu-toggle-slider"></span>
              </div>
            </button>
          </div>

          {/* Logout / Login */}
          <div className="mobile-menu-section">
            {user ? (
              <button
                className="mobile-menu-logout-btn"
                onClick={handleLogout}
              >
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Logout
              </button>
            ) : (
              <div className="mobile-menu-login">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default MobileMenuPanel;
