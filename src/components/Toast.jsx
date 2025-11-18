import { useEffect } from 'react';

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

  const baseClasses = [
    'fixed bottom-4 right-4 left-4 md:bottom-8 md:right-8 md:left-auto',
    'min-w-0 md:min-w-[300px] max-w-[500px]',
    'p-4 px-6',
    'bg-[var(--bg-primary)]',
    'rounded-lg',
    'shadow-[0_4px_12px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.1)]',
    'dark:shadow-[0_4px_12px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.3)]',
    'border border-[var(--border-color)]',
    'animate-slide-in-up',
    'z-[9999]',
    'flex items-center justify-between gap-4'
  ].join(' ');

  const variantClasses = type === 'success'
    ? 'border-l-4 border-l-green-500'
    : 'border-l-4 border-l-red-500';

  const iconColorClass = type === 'success' ? 'text-green-500' : 'text-red-500';

  return (
    <div className={`${baseClasses} ${variantClasses}`}>
      <div className="flex items-center gap-3 flex-1">
        {type === 'success' && (
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20" className={`flex-shrink-0 ${iconColorClass}`}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {type === 'error' && (
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20" className={`flex-shrink-0 ${iconColorClass}`}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
        <span className="text-[var(--text-primary)] text-sm leading-6">{message}</span>
      </div>
      <button
        className="bg-transparent border-none cursor-pointer p-1 text-[var(--text-secondary)] transition-colors duration-200 flex-shrink-0 hover:text-[var(--text-primary)]"
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
