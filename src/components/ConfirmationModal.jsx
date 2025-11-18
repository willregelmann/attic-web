import { Modal, ModalButton } from './Modal';

/**
 * ConfirmationModal - Generic confirmation dialog for any action
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
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  confirmVariant = "default",
  loading = false
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      testId="batch-action-modal"
      footer={
        <>
          <ModalButton
            onClick={onClose}
            disabled={loading}
            testId="batch-modal-cancel"
          >
            Cancel
          </ModalButton>
          <ModalButton
            onClick={onConfirm}
            variant={confirmVariant === 'danger' ? 'danger' : 'primary'}
            disabled={loading}
            testId="batch-modal-confirm"
          >
            {loading ? 'Processing...' : confirmText}
          </ModalButton>
        </>
      }
    >
      <p className="text-[15px] leading-relaxed text-[var(--text-secondary)] m-0">
        {message}
      </p>
    </Modal>
  );
}
