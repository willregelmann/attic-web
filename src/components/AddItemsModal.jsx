import { useState, useEffect } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { SEMANTIC_SEARCH_DATABASE_OF_THINGS, ADD_ITEM_TO_MY_COLLECTION, GET_MY_ITEMS } from '../queries';
import { formatEntityType, isCollectionType } from '../utils/formatters';
import './AddItemsModal.css';

function AddItemsModal({ isOpen, onClose, onItemsAdded, preSelectedItem = null }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [notes, setNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);

  // Search query
  const [searchItems, { data: searchData, loading: searchLoading }] = useLazyQuery(
    SEMANTIC_SEARCH_DATABASE_OF_THINGS,
    {
      fetchPolicy: 'network-only'
    }
  );

  // Add mutation - refetch owned items after adding
  const [addItemToCollection] = useMutation(ADD_ITEM_TO_MY_COLLECTION, {
    refetchQueries: [{ query: GET_MY_ITEMS }],
    awaitRefetchQueries: true
  });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedItem(preSelectedItem);
      setNotes('');
      setError(null);
      setIsAdding(false);
    }
  }, [isOpen, preSelectedItem]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) return;

    const timeoutId = setTimeout(() => {
      searchItems({
        variables: {
          query: searchQuery,
          type: 'collectible',
          first: 50
        }
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchItems]);

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setNotes('');
    setError(null);
  };

  const handleBack = () => {
    setSelectedItem(null);
    setNotes('');
    setError(null);
  };

  const handleConfirm = async () => {
    if (!selectedItem) return;

    setIsAdding(true);
    setError(null);

    try {
      await addItemToCollection({
        variables: {
          itemId: selectedItem.id,
          notes: notes || null
        }
      });

      // Success - close modal and notify parent
      if (onItemsAdded) {
        onItemsAdded();
      }
      onClose();
    } catch (err) {
      console.error('Error adding item:', err);

      // Handle duplicate error
      if (err.message.includes('Duplicate') || err.message.includes('already exists')) {
        setError('This item is already in your collection!');
      } else {
        setError('Failed to add item. Please try again.');
      }

      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  const searchResults = searchData?.databaseOfThingsSemanticSearch || [];
  const filteredResults = searchResults.filter(item => !isCollectionType(item.type));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-items-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>Add to My Collection</h2>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {!selectedItem ? (
            // Search Mode
            <>
              <div className="modal-section">
                <h3>Search for an Item</h3>
                <p className="section-description">Search for collectibles to add to your collection</p>
              </div>

              <div className="items-toolbar-modal">
                <div className="search-box-modal">
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20" className="search-icon">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search for items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="search-clear"
                      onClick={() => setSearchQuery('')}
                    >
                      <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="items-list-modal">
                {searchLoading ? (
                  <div className="loading">Searching...</div>
                ) : searchQuery.length < 3 ? (
                  <div className="no-items-message">
                    <svg viewBox="0 0 24 24" fill="none" width="48" height="48" style={{ opacity: 0.3, marginBottom: '1rem' }}>
                      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                      <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <p>Type at least 3 characters to search</p>
                  </div>
                ) : filteredResults.length === 0 ? (
                  <div className="no-items-message">No items found</div>
                ) : (
                  filteredResults.map(item => (
                    <div
                      key={item.id}
                      className="item-row-selectable"
                      onClick={() => handleSelectItem(item)}
                    >
                      <div className="item-image-small">
                        {(item.thumbnail_url || item.image_url) ? (
                          <img src={item.thumbnail_url || item.image_url} alt={item.name} />
                        ) : (
                          <div className="image-placeholder-small">
                            <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                              <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                              <path d="M3 15l5-5 4 4 5-5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="item-info">
                        <span className="item-name">{item.name}</span>
                        <span className="item-meta">
                          {formatEntityType(item.type)}
                          {item.year && ` • ${item.year}`}
                        </span>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" width="20" height="20" className="item-arrow">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            // Confirm Mode
            <>
              <div className="modal-section">
                <button className="back-to-search" onClick={handleBack}>
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back to Search
                </button>

                <div className="selected-item-preview">
                  <div className="selected-item-image">
                    {selectedItem.image_url ? (
                      <img src={selectedItem.image_url} alt={selectedItem.name} />
                    ) : (
                      <div className="image-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                          <path d="M3 15l5-5 4 4 5-5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="selected-item-details">
                    <h3>{selectedItem.name}</h3>
                    <p className="item-type-badge">{formatEntityType(selectedItem.type)}</p>
                    {selectedItem.year && <p className="item-year">Year: {selectedItem.year}</p>}
                  </div>
                </div>

                <div className="notes-section">
                  <label htmlFor="item-notes">Notes (optional)</label>
                  <textarea
                    id="item-notes"
                    className="notes-input"
                    placeholder="Add any notes about this item (condition, variant, etc.)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                {error && (
                  <div className="error-message">
                    <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {error}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={isAdding}>
            Cancel
          </button>
          <button
            className="btn-confirm"
            onClick={handleConfirm}
            disabled={!selectedItem || isAdding}
          >
            {isAdding ? 'Adding...' : 'Add to Collection'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddItemsModal;
