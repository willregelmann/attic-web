import { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client/react';
import { ADD_CUSTOM_ITEM_TO_MY_COLLECTION, MY_COLLECTION_TREE } from '../queries';
import { ImageUpload } from './ImageUpload';
import './AddCustomItemModal.css';

/**
 * AddCustomItemModal - Modal for adding custom (non-DBoT) items to collection
 *
 * Allows users to quickly add items that don't exist in the Database of Things.
 * Supports name, notes, and image uploads.
 *
 * @param {Object} props
 * @param {Boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Callback to close modal
 * @param {String} props.parentCollectionId - Parent collection to add item to (optional)
 * @param {Function} props.onSuccess - Callback after successful addition
 */
function AddCustomItemModal({ isOpen, onClose, parentCollectionId, onSuccess }) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // GraphQL mutation
  const [addCustomItem] = useMutation(ADD_CUSTOM_ITEM_TO_MY_COLLECTION, {
    refetchQueries: [
      { query: MY_COLLECTION_TREE, variables: { parentId: parentCollectionId } }
    ],
    awaitRefetchQueries: true
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setName('');
      setNotes('');
      setImages([]);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, loading]);

  // Form validation
  const isFormValid = () => {
    return name.trim().length > 0;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const variables = {
        name: name.trim(),
        notes: notes.trim() || null,
        parentCollectionId: parentCollectionId || null,
        images: images.length > 0 ? images : null
      };

      const { data } = await addCustomItem({ variables });

      if (!data || !data.addCustomItemToMyCollection) {
        throw new Error('Invalid response from server');
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(data.addCustomItemToMyCollection);
      }

      onClose();
    } catch (err) {
      console.error('Error adding custom item:', err);
      setError(err.message || 'Failed to add custom item');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={loading ? null : onClose}>
      <div className="modal-content add-custom-item-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Custom Item</h2>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="item-name">
                Item Name <span className="required">*</span>
              </label>
              <input
                id="item-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter item name"
                disabled={loading}
                required
                autoFocus
                maxLength={255}
              />
            </div>

            <div className="form-group">
              <label htmlFor="item-notes">Notes (optional)</label>
              <textarea
                id="item-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this item"
                disabled={loading}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>Images (optional)</label>
              <ImageUpload
                images={images}
                onChange={setImages}
                disabled={loading}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="button-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button-primary"
              disabled={!isFormValid() || loading}
            >
              {loading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCustomItemModal;
