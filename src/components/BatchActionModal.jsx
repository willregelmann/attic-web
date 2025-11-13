import './BatchActionModal.css';

/**
 * BatchActionModal - Confirmation dialog for batch operations
 *
 * @param {Boolean} isOpen - Whether modal is visible
 * @param {Function} onClose - Callback when modal is closed
 * @param {Function} onConfirm - Callback when action is confirmed
 * @param {String} title - Modal title
 * @param {String} message - Confirmation message
 * @param {String} confirmText - Text for confirm button (default: "Confirm")
 * @param {String} confirmVariant - Button variant: "default", "danger" (default: "default")
 * @param {Boolean} loading - Whether action is in progress
 */
export function BatchActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  confirmVariant = "default",
  loading = false
}) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className="batch-modal-overlay" onClick={onClose}>
      <div className="batch-modal" onClick={(e) => e.stopPropagation()}>
        <div className="batch-modal-header">
          <h3>{title}</h3>
        </div>

        <div className="batch-modal-body">
          <p className="confirmation-text">{message}</p>
        </div>

        <div className="batch-modal-footer">
          <button
            className="cancel-button"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`confirm-button ${confirmVariant === 'danger' ? 'danger' : ''}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
