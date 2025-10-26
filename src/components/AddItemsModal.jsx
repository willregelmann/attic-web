import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_COLLECTIONS, GET_COLLECTION_ITEMS, ADD_ITEM_TO_MY_COLLECTION } from '../queries';
import { formatEntityType } from '../utils/formatters';
import './AddItemsModal.css';

function AddItemsModal({ isOpen, onClose, onItemsAdded }) {
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [selectedItems, setSelectedItems] = useState({}); // { itemId: quantity }
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Get all collections
  const { data: collectionsData, loading: collectionsLoading } = useQuery(GET_COLLECTIONS, {
    skip: !isOpen
  });

  // Get items from selected collection
  const { data: itemsData, loading: itemsLoading } = useQuery(GET_COLLECTION_ITEMS, {
    variables: { collectionId: selectedCollection?.id },
    skip: !selectedCollection?.id,
    fetchPolicy: 'cache-and-network'
  });

  // Mutation to add items
  const [addItemToCollection] = useMutation(ADD_ITEM_TO_MY_COLLECTION);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCollection(null);
      setSelectedItems({});
      setSearchTerm('');
      setIsAdding(false);
    }
  }, [isOpen]);

  const handleCollectionSelect = (collection) => {
    setSelectedCollection(collection);
    setSelectedItems({});
  };

  const handleQuantityChange = (itemId, quantity) => {
    const newItems = { ...selectedItems };
    if (quantity > 0) {
      newItems[itemId] = quantity;
    } else {
      delete newItems[itemId];
    }
    setSelectedItems(newItems);
  };

  const handleConfirm = async () => {
    setIsAdding(true);

    try {
      // Create UserItem records for each selected item
      const promises = [];
      for (const [itemId, quantity] of Object.entries(selectedItems)) {
        for (let i = 0; i < quantity; i++) {
          promises.push(
            addItemToCollection({
              variables: {
                itemId: itemId,
                metadata: {
                  addedAt: new Date().toISOString()
                }
              }
            })
          );
        }
      }

      await Promise.all(promises);

      // Notify parent component
      if (onItemsAdded) {
        onItemsAdded(selectedItems);
      }

      onClose();
    } catch (error) {
      console.error('Error adding items:', error);
      alert('Failed to add some items. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  const collections = collectionsData?.collections || [];
  const items = itemsData?.collectionItems || [];

  // Filter items based on search
  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    return item.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calculate total items to add
  const totalQuantity = Object.values(selectedItems).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-items-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add to My Collection</h2>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-content">
          {!selectedCollection ? (
            <>
              <div className="modal-section">
                <h3>Select a Collection</h3>
                <p className="section-description">Choose a collection to browse its items</p>
              </div>

              <div className="collections-grid">
                {collectionsLoading ? (
                  <div className="loading">Loading collections...</div>
                ) : (
                  collections.map(collection => (
                    <div
                      key={collection.id}
                      className="collection-option"
                      onClick={() => handleCollectionSelect(collection)}
                    >
                      <div className="collection-image-small">
                        <div className="image-placeholder-small">
                          <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
                            <rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="2"/>
                            <path d="M3 10h18" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </div>
                      </div>
                      <div className="collection-info">
                        <h4>{collection.name}</h4>
                        <span className="collection-type">{formatEntityType(collection.type)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="modal-section">
                <button className="back-to-collections" onClick={() => setSelectedCollection(null)}>
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back to Collections
                </button>

                <h3>{selectedCollection.name}</h3>
                <p className="section-description">
                  Select items and quantities to add • {totalQuantity} item{totalQuantity !== 1 ? 's' : ''} selected
                </p>
              </div>

              <div className="items-toolbar-modal">
                <div className="search-box-modal">
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20" className="search-icon">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="items-list-modal">
                {itemsLoading ? (
                  <div className="loading">Loading items...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="no-items-message">
                    {searchTerm ? 'No matching items found' : 'No items in this collection'}
                  </div>
                ) : (
                  filteredItems.map(item => (
                    <div key={item.id} className="item-row-with-quantity">
                      <div className="item-info">
                        <span className="item-name">{item.name}</span>
                        <span className="item-type-badge">{formatEntityType(item.type)}</span>
                      </div>
                      <div className="quantity-controls">
                        <button
                          className="qty-btn"
                          onClick={() => handleQuantityChange(item.id, (selectedItems[item.id] || 0) - 1)}
                          disabled={!selectedItems[item.id]}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          className="qty-input"
                          value={selectedItems[item.id] || 0}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                          min="0"
                        />
                        <button
                          className="qty-btn"
                          onClick={() => handleQuantityChange(item.id, (selectedItems[item.id] || 0) + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={isAdding}>
            Cancel
          </button>
          <button
            className="btn-confirm"
            onClick={handleConfirm}
            disabled={totalQuantity === 0 || isAdding}
          >
            {isAdding ? 'Adding...' : `Add ${totalQuantity} Item${totalQuantity !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddItemsModal;