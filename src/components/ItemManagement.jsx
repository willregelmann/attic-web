import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  CREATE_ITEM,
  UPDATE_ITEM,
  DELETE_ITEM,
  GET_ALL_ITEMS,
  ADD_ITEM_TO_COLLECTION,
  GET_COLLECTIONS
} from '../queries';
import './ItemManagement.css';

const ItemManagement = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [filterType, setFilterType] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'COLLECTIBLE',
    metadata: {
      description: '',
      category: '',
      manufacturer: '',
      release_year: '',
      rarity: '',
      condition: '',
      notes: ''
    }
  });

  // Query for all items
  const { data: itemsData, loading: itemsLoading, refetch: refetchItems } = useQuery(GET_ALL_ITEMS, {
    variables: filterType ? { type: filterType } : {}
  });

  // Query for collections (for adding items to collections)
  const { data: collectionsData } = useQuery(GET_COLLECTIONS);

  // Mutations
  const [createItem] = useMutation(CREATE_ITEM, {
    onCompleted: () => {
      setShowCreateForm(false);
      resetForm();
      refetchItems();
    },
    onError: (err) => {
      alert(`Error creating item: ${err.message}`);
    }
  });

  const [updateItem] = useMutation(UPDATE_ITEM, {
    onCompleted: () => {
      setShowEditForm(false);
      setSelectedItem(null);
      resetForm();
      refetchItems();
    },
    onError: (err) => {
      alert(`Error updating item: ${err.message}`);
    }
  });

  const [deleteItem] = useMutation(DELETE_ITEM, {
    onCompleted: () => {
      refetchItems();
    },
    onError: (err) => {
      alert(`Error deleting item: ${err.message}`);
    }
  });

  const [addItemToCollection] = useMutation(ADD_ITEM_TO_COLLECTION, {
    onCompleted: () => {
      setShowAddToCollection(false);
      setSelectedCollection('');
      alert('Item added to collection successfully!');
    },
    onError: (err) => {
      alert(`Error adding item to collection: ${err.message}`);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'COLLECTIBLE',
      metadata: {
        description: '',
        category: '',
        manufacturer: '',
        release_year: '',
        rarity: '',
        condition: '',
        notes: ''
      }
    });
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();

    // Clean up empty metadata fields
    const cleanMetadata = Object.entries(formData.metadata).reduce((acc, [key, value]) => {
      if (value && value.trim() !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    createItem({
      variables: {
        name: formData.name,
        type: formData.type,
        metadata: Object.keys(cleanMetadata).length > 0 ? cleanMetadata : null
      }
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();

    // Clean up empty metadata fields
    const cleanMetadata = Object.entries(formData.metadata).reduce((acc, [key, value]) => {
      if (value && value.trim() !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    updateItem({
      variables: {
        id: selectedItem.id,
        name: formData.name,
        metadata: Object.keys(cleanMetadata).length > 0 ? cleanMetadata : null
      }
    });
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      type: item.type,
      metadata: {
        description: item.metadata?.description || '',
        category: item.metadata?.category || '',
        manufacturer: item.metadata?.manufacturer || '',
        release_year: item.metadata?.release_year || '',
        rarity: item.metadata?.rarity || '',
        condition: item.metadata?.condition || '',
        notes: item.metadata?.notes || ''
      }
    });
    setShowEditForm(true);
  };

  const handleDelete = (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      deleteItem({ variables: { id: item.id } });
    }
  };

  const handleAddToCollection = (item) => {
    setSelectedItem(item);
    setShowAddToCollection(true);
  };

  const handleAddToCollectionSubmit = (e) => {
    e.preventDefault();
    if (!selectedCollection) {
      alert('Please select a collection');
      return;
    }

    addItemToCollection({
      variables: {
        collectionId: selectedCollection,
        itemId: selectedItem.id
      }
    });
  };

  const items = itemsData?.items || [];
  const collections = collectionsData?.collections || [];

  return (
    <div className="item-management">
      <div className="item-management-header">
        <h2>Item Management</h2>
        <div className="header-actions">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="type-filter"
          >
            <option value="">All Types</option>
            <option value="COLLECTION">Collections</option>
            <option value="COLLECTIBLE">Collectibles</option>
            <option value="VARIANT">Variants</option>
            <option value="COMPONENT">Components</option>
          </select>
          <button
            className="btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            Create New Item
          </button>
        </div>
      </div>

      {/* Create Item Form */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Item</h3>
              <button
                className="close-button"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="item-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Item Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Charizard Base Set"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="type">Type *</label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="COLLECTIBLE">Collectible</option>
                    <option value="COLLECTION">Collection</option>
                    <option value="VARIANT">Variant</option>
                    <option value="COMPONENT">Component</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.metadata.description}
                  onChange={(e) => setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, description: e.target.value }
                  })}
                  placeholder="Enter item description..."
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <input
                    type="text"
                    id="category"
                    value={formData.metadata.category}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, category: e.target.value }
                    })}
                    placeholder="e.g., Trading Card, Action Figure"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="manufacturer">Manufacturer</label>
                  <input
                    type="text"
                    id="manufacturer"
                    value={formData.metadata.manufacturer}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, manufacturer: e.target.value }
                    })}
                    placeholder="e.g., Nintendo, Hasbro"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="release_year">Release Year</label>
                  <input
                    type="text"
                    id="release_year"
                    value={formData.metadata.release_year}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, release_year: e.target.value }
                    })}
                    placeholder="e.g., 1999"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="rarity">Rarity</label>
                  <input
                    type="text"
                    id="rarity"
                    value={formData.metadata.rarity}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, rarity: e.target.value }
                    })}
                    placeholder="e.g., Rare, Common, Ultra Rare"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  value={formData.metadata.notes}
                  onChange={(e) => setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, notes: e.target.value }
                  })}
                  placeholder="Any additional notes..."
                  rows="2"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Create Item
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Form */}
      {showEditForm && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Item</h3>
              <button
                className="close-button"
                onClick={() => {
                  setShowEditForm(false);
                  setSelectedItem(null);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="item-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-name">Item Name *</label>
                  <input
                    type="text"
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Type</label>
                  <input
                    type="text"
                    value={formData.type}
                    disabled
                    className="disabled-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-description">Description</label>
                <textarea
                  id="edit-description"
                  value={formData.metadata.description}
                  onChange={(e) => setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, description: e.target.value }
                  })}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-category">Category</label>
                  <input
                    type="text"
                    id="edit-category"
                    value={formData.metadata.category}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, category: e.target.value }
                    })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-manufacturer">Manufacturer</label>
                  <input
                    type="text"
                    id="edit-manufacturer"
                    value={formData.metadata.manufacturer}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, manufacturer: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowEditForm(false);
                    setSelectedItem(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add to Collection Modal */}
      {showAddToCollection && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content small">
            <div className="modal-header">
              <h3>Add to Collection</h3>
              <button
                className="close-button"
                onClick={() => {
                  setShowAddToCollection(false);
                  setSelectedItem(null);
                  setSelectedCollection('');
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddToCollectionSubmit} className="add-to-collection-form">
              <p>Add <strong>{selectedItem.name}</strong> to:</p>

              <div className="form-group">
                <label htmlFor="collection-select">Select Collection *</label>
                <select
                  id="collection-select"
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  required
                >
                  <option value="">-- Select a Collection --</option>
                  {collections.map(collection => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Add to Collection
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddToCollection(false);
                    setSelectedItem(null);
                    setSelectedCollection('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="items-list">
        <h3>Items ({items.length})</h3>
        {itemsLoading ? (
          <p>Loading items...</p>
        ) : items.length === 0 ? (
          <p className="no-items">No items yet. Create your first item above!</p>
        ) : (
          <div className="items-grid">
            {items.map((item) => (
              <div key={item.id} className="item-card">
                <div className="item-card-header">
                  <h4>{item.name}</h4>
                  <span className={`item-type ${item.type.toLowerCase()}`}>
                    {item.type}
                  </span>
                </div>

                {item.metadata?.description && (
                  <p className="item-description">{item.metadata.description}</p>
                )}

                <div className="item-metadata">
                  {item.metadata?.category && (
                    <span className="metadata-item">
                      <strong>Category:</strong> {item.metadata.category}
                    </span>
                  )}
                  {item.metadata?.manufacturer && (
                    <span className="metadata-item">
                      <strong>Manufacturer:</strong> {item.metadata.manufacturer}
                    </span>
                  )}
                  {item.metadata?.release_year && (
                    <span className="metadata-item">
                      <strong>Year:</strong> {item.metadata.release_year}
                    </span>
                  )}
                  {item.metadata?.rarity && (
                    <span className="metadata-item">
                      <strong>Rarity:</strong> {item.metadata.rarity}
                    </span>
                  )}
                </div>

                {item.parents && item.parents.length > 0 && (
                  <div className="item-parents">
                    <strong>Part of:</strong>
                    <ul>
                      {item.parents.map(parent => (
                        <li key={parent.id}>{parent.name}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="item-card-actions">
                  {item.type === 'COLLECTIBLE' && (
                    <button
                      className="btn-add"
                      onClick={() => handleAddToCollection(item)}
                    >
                      Add to Collection
                    </button>
                  )}
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(item)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemManagement;