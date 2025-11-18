import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

// Get Google Client ID from environment variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function MobileMenuPanel({ isOpen, onClose, user, onLogout, isDarkMode, toggleDarkMode }) {
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

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[1999]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-in Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-[var(--bg-primary)] shadow-[-2px_0_8px_rgba(0,0,0,0.15)] z-[2000] flex flex-col overflow-y-auto transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
        data-testid="mobile-nav"
      >
        <div className="p-4 flex justify-end border-b border-[var(--border-color)]">
          <button
            className="bg-transparent border-none text-[var(--text-primary)] cursor-pointer p-2 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-6">
          {/* User Section - Show avatar/name when logged in */}
          {user && (
            <div className="flex items-center gap-4 p-4 bg-[var(--bg-secondary)] rounded-xl">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xl font-semibold shrink-0">
                {user.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[var(--text-primary)] text-base whitespace-nowrap overflow-hidden text-ellipsis">
                  {user.name}
                </div>
                <div className="text-sm text-[var(--text-secondary)] whitespace-nowrap overflow-hidden text-ellipsis">
                  {user.email}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {user ? (
              <button
                className="flex items-center gap-4 p-4 bg-transparent border-none rounded-xl text-[var(--text-primary)] text-base font-medium cursor-pointer transition-all text-left w-full hover:bg-[var(--bg-secondary)] [&_svg]:text-[var(--text-secondary)] [&_svg]:shrink-0"
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
                className="flex items-center gap-4 p-4 bg-transparent border-none rounded-xl text-[var(--text-primary)] text-base font-medium cursor-pointer transition-all text-left w-full hover:bg-[var(--bg-secondary)] [&_svg]:text-[var(--text-secondary)] [&_svg]:shrink-0"
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
          <div className="border-t border-[var(--border-color)] pt-4">
            <button
              className="flex items-center justify-between p-4 bg-transparent border-none rounded-xl text-[var(--text-primary)] text-base font-medium cursor-pointer transition-all w-full hover:bg-[var(--bg-secondary)]"
              onClick={toggleDarkMode}
            >
              <div className="flex items-center gap-4 [&_svg]:text-[var(--text-secondary)] [&_svg]:shrink-0">
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
              <div className="relative w-12 h-7 shrink-0">
                <input
                  type="checkbox"
                  checked={isDarkMode}
                  onChange={toggleDarkMode}
                  className="peer opacity-0 w-0 h-0"
                />
                <span className={`absolute cursor-pointer inset-0 rounded-full transition-colors duration-300 ${
                  isDarkMode ? 'bg-[var(--primary)]' : 'bg-[var(--bg-tertiary)]'
                }`}>
                  <span className={`absolute h-5 w-5 left-1 bottom-1 bg-white rounded-full transition-transform duration-300 ${
                    isDarkMode ? 'translate-x-5' : ''
                  }`}></span>
                </span>
              </div>
            </button>
          </div>

          {/* Logout / Login */}
          <div className="border-t border-[var(--border-color)] pt-4">
            {user ? (
              <button
                className="flex items-center gap-4 p-4 bg-transparent border border-[var(--border-color)] rounded-xl text-red-500 text-base font-medium cursor-pointer transition-all w-full hover:bg-red-500/10 hover:border-red-500 [&_svg]:shrink-0"
                onClick={handleLogout}
              >
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Logout
              </button>
            ) : GOOGLE_CLIENT_ID ? (
              <div className="flex justify-center py-2">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                />
              </div>
            ) : (
              <div className="text-center text-[var(--text-secondary)]">
                <p>Google Sign-In not configured</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default MobileMenuPanel;
