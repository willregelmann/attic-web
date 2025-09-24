import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import './LoginModal.css';

function LoginModal({ isOpen, onClose }) {
  const { login } = useAuth();

  const handleGoogleSuccess = (credentialResponse) => {
    try {
      const userData = login(credentialResponse.credential);
      console.log('Login successful:', userData);
      onClose();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="modal-header">
          <h2>Welcome to Attic</h2>
          <p>Sign in to track your personal collection</p>
        </div>

        <div className="modal-body">
          <div className="auth-benefits">
            <div className="benefit-item">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>Track owned items</span>
            </div>
            <div className="benefit-item">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Save your progress</span>
            </div>
            <div className="benefit-item">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>Sync across devices</span>
            </div>
          </div>

          <div className="google-login-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_blue"
              size="large"
              text="continue_with"
              shape="rectangular"
              width="280"
            />
          </div>

          <div className="privacy-note">
            <p>We only store your email and name to identify your collection. Your data is never shared.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;