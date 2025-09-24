import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_COLLECTION, UPDATE_COLLECTION, DELETE_COLLECTION, GET_COLLECTIONS } from '../queries';
import './CollectionAdmin.css';

const CollectionAdmin = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: ''
  });

  const { data, loading, error, refetch } = useQuery(GET_COLLECTIONS);
  
  const [createCollection] = useMutation(CREATE_COLLECTION, {
    onCompleted: () => {
      setIsCreating(false);
      setFormData({ name: '', description: '', category: '' });
      refetch();
    },
    onError: (err) => {
      alert(`Error creating collection: ${err.message}`);
    }
  });

  const [updateCollection] = useMutation(UPDATE_COLLECTION, {
    onCompleted: () => {
      setEditingId(null);
      setFormData({ name: '', description: '', category: '' });
      refetch();
    },
    onError: (err) => {
      alert(`Error updating collection: ${err.message}`);
    }
  });

  const [deleteCollection] = useMutation(DELETE_COLLECTION, {
    onCompleted: () => {
      refetch();
    },
    onError: (err) => {
      alert(`Error deleting collection: ${err.message}`);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const metadata = {
      description: formData.description,
      category: formData.category
    };

    if (editingId) {
      await updateCollection({
        variables: {
          id: editingId,
          name: formData.name,
          metadata
        }
      });
    } else {
      await createCollection({
        variables: {
          name: formData.name,
          metadata
        }
      });
    }
  };

  const handleEdit = (collection) => {
    setEditingId(collection.id);
    setFormData({
      name: collection.name,
      description: collection.metadata?.description || '',
      category: collection.metadata?.category || ''
    });
    setIsCreating(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the collection "${name}"? This action cannot be undone.`)) {
      await deleteCollection({
        variables: { id }
      });
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: '', description: '', category: '' });
  };

  if (loading) return <div className="collection-admin-loading">Loading collections...</div>;
  if (error) return <div className="collection-admin-error">Error: {error.message}</div>;

  const collections = data?.collections || [];

  return (
    <div className="collection-admin">
      <div className="collection-admin-header">
        <h2>Collection Administration</h2>
        {!isCreating && (
          <button 
            className="btn-primary"
            onClick={() => setIsCreating(true)}
          >
            Create New Collection
          </button>
        )}
      </div>

      {isCreating && (
        <div className="collection-form-container">
          <h3>{editingId ? 'Edit Collection' : 'Create New Collection'}</h3>
          <form onSubmit={handleSubmit} className="collection-form">
            <div className="form-group">
              <label htmlFor="name">Collection Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Pokemon Base Set"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter a description for this collection..."
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <input
                type="text"
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Trading Cards, Comics, etc."
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingId ? 'Update Collection' : 'Create Collection'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="collections-list">
        <h3>Existing Collections ({collections.length})</h3>
        {collections.length === 0 ? (
          <p className="no-collections">No collections yet. Create your first collection above!</p>
        ) : (
          <div className="collections-grid">
            {collections.map((collection) => (
              <div key={collection.id} className="collection-card">
                <div className="collection-card-image">
                  {collection.primaryImage ? (
                    <img 
                      src={collection.primaryImage.url} 
                      alt={collection.primaryImage.alt_text || collection.name}
                    />
                  ) : (
                    <div className="placeholder-image">
                      <span>{collection.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="collection-card-content">
                  <h4>{collection.name}</h4>
                  {collection.metadata?.description && (
                    <p className="collection-description">{collection.metadata.description}</p>
                  )}
                  {collection.metadata?.category && (
                    <span className="collection-category">{collection.metadata.category}</span>
                  )}
                </div>
                <div className="collection-card-actions">
                  <button 
                    className="btn-edit"
                    onClick={() => handleEdit(collection)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(collection.id, collection.name)}
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

export default CollectionAdmin;