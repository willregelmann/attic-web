import { useEffect } from 'react';
import './Toast.css';

/**
 * Toast - Simple toast notification component
 *
 * @param {Object} props
 * @param {String} props.message - Message to display
 * @param {String} props.type - 'success' or 'error'
 * @param {Function} props.onClose - Callback when toast auto-closes
 * @param {Number} props.duration - Duration in ms (default 3000)
 */
function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        {type === 'success' && (
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20" className="toast-icon">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {type === 'error' && (
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20" className="toast-icon">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
        <span className="toast-message">{message}</span>
      </div>
      <button
        className="toast-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

export default Toast;
