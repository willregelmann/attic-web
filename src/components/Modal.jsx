import { useEffect } from 'react';

/**
 * Modal - Generic reusable modal component
 *
 * @param {Boolean} isOpen - Whether modal is visible
 * @param {Function} onClose - Callback when modal is closed (escape key or overlay click)
 * @param {String} title - Optional modal title
 * @param {ReactNode} children - Modal content
 * @param {ReactNode} footer - Optional footer content (typically buttons)
 * @param {String} size - Modal size: "sm", "md", "lg", "xl", "full" (default: "md")
 * @param {Boolean} closeOnOverlayClick - Whether clicking overlay closes modal (default: true)
 * @param {Boolean} closeOnEscape - Whether escape key closes modal (default: true)
 * @param {Boolean} showCloseButton - Whether to show X close button in header (default: false)
 * @param {String} testId - Optional data-testid for testing
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = false,
  testId
}) {
  // Handle Escape key to close modal
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Size classes for modal width
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-[90vw] max-h-[90vh]'
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[2000] p-4 md:p-5"
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`bg-[var(--bg-primary)] rounded-xl ${sizeClasses[size] || sizeClasses.md} w-full shadow-[0_20px_60px_rgba(0,0,0,0.3)] flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
        data-testid={testId}
      >
        {(title || showCloseButton) && (
          <div className="relative pt-6 px-6 pb-4 border-b border-[var(--border-color)] shrink-0">
            {title && (
              <h3 id="modal-title" className="m-0 text-xl font-semibold text-[var(--text-primary)] pr-8">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                className="absolute top-4 right-4 bg-transparent border-none text-[var(--text-secondary)] cursor-pointer p-1 flex items-center justify-center transition-colors duration-200 hover:text-[var(--text-primary)]"
                onClick={onClose}
                aria-label="Close modal"
              >
                <svg viewBox="0 0 24 24" fill="none" width="24" height="24" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        )}

        <div className={`${title ? 'p-6' : 'pt-6 px-6 pb-6'} overflow-y-auto flex-1`}>
          {children}
        </div>

        {footer && (
          <div className="py-4 px-6 border-t border-[var(--border-color)] flex gap-3 justify-end shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ModalButton - Consistent button styling for modal footers
 *
 * @param {ReactNode} children - Button text
 * @param {Function} onClick - Click handler
 * @param {String} variant - "default", "primary", "danger" (default: "default")
 * @param {Boolean} disabled - Whether button is disabled
 * @param {String} testId - Optional data-testid for testing
 */
export function ModalButton({
  children,
  onClick,
  variant = 'default',
  disabled = false,
  testId
}) {
  const baseClasses = 'py-2.5 px-5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    default: 'border bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]',
    primary: 'border-none text-white bg-[var(--bright-blue)] hover:bg-[var(--navy-blue)]',
    danger: 'border-none text-white bg-[#ef4444] hover:bg-[#dc2626]'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.default}`}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
    >
      {children}
    </button>
  );
}
