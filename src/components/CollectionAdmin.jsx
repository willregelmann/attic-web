import React, { useState, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { 
  CREATE_COLLECTION, 
  UPDATE_COLLECTION, 
  DELETE_COLLECTION, 
  GET_COLLECTIONS,
  UPLOAD_COLLECTION_IMAGE 
} from '../queries';
import CuratorConfig from './CuratorConfig';
import HierarchicalSuggestions from './HierarchicalSuggestions';
import './CollectionAdmin.css';

const CollectionAdmin = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const fileInputRef = useRef(null);

  const { data, loading, error, refetch } = useQuery(GET_COLLECTIONS);
  
  const [createCollection] = useMutation(CREATE_COLLECTION, {
    onCompleted: () => {
      setIsCreating(false);
      setFormData({ name: '', description: '', category: '' });
      setImagePreview(null);
      setSelectedFile(null);
      refetch();
    },
    onError: (err) => {
      alert(`Error creating collection: ${err.message}`);
    }
  });

  const [updateCollection] = useMutation(UPDATE_COLLECTION, {
    onCompleted: () => {
      setFormData({ name: '', description: '', category: '' });
      setImagePreview(null);
      setSelectedFile(null);
      setIsEditMode(false);
      refetch();
      // Update the selected collection with new data
      if (selectedCollection) {
        const updatedCollection = data?.collections?.find(c => c.id === selectedCollection.id);
        if (updatedCollection) {
          setSelectedCollection(updatedCollection);
        }
      }
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

  const [uploadCollectionImage] = useMutation(UPLOAD_COLLECTION_IMAGE, {
    onCompleted: () => {
      setUploadingImage(false);
      refetch();
    },
    onError: (err) => {
      setUploadingImage(false);
      alert(`Error uploading image: ${err.message}`);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const metadata = {
      description: formData.description,
      category: formData.category
    };

    let collectionId = null;

    if (isCreating) {
      const result = await createCollection({
        variables: {
          name: formData.name,
          metadata
        }
      });
      collectionId = result.data.createCollection.id;
    }

    // Upload image if provided
    if (selectedFile && collectionId) {
      await handleImageUpload(collectionId);
    }
  };

  const handleUpdateCollection = async (e) => {
    e.preventDefault();
    
    const metadata = {
      description: formData.description,
      category: formData.category
    };

    await updateCollection({
      variables: {
        id: selectedCollection.id,
        name: formData.name,
        metadata
      }
    });

    // Upload image if provided
    if (selectedFile) {
      await handleImageUpload(selectedCollection.id);
    }

    setIsEditMode(false);
    setActiveTab('details');
  };

  const handleEditInModal = () => {
    setFormData({
      name: selectedCollection.name,
      description: selectedCollection.metadata?.description || '',
      category: selectedCollection.metadata?.category || ''
    });
    setImagePreview(selectedCollection.primaryImage?.url || null);
    setSelectedFile(null);
    setIsEditMode(true);
    setActiveTab('edit');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Image size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async (collectionId) => {
    if (!collectionId || !selectedFile) return;
    
    setUploadingImage(true);
    
    // Convert file to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result;
        
        await uploadCollectionImage({
          variables: {
            collectionId: collectionId,
            imageData: base64Data,
            filename: selectedFile.name,
            mimeType: selectedFile.type,
            altText: formData.name
          }
        });
      } catch (error) {
        console.error('Failed to upload image:', error);
        alert(`Failed to upload image: ${error.message}`);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    setFormData({ name: '', description: '', category: '' });
    setImagePreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setFormData({ name: '', description: '', category: '' });
    setImagePreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setActiveTab('details');
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
          <h3>Create New Collection</h3>
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

            <div className="form-group">
              <label htmlFor="imageFile">Cover Image</label>
              <div className="file-input-container">
                <input
                  type="file"
                  id="imageFile"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn-file-select"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? 'Change Image' : 'Select Image'}
                </button>
                {selectedFile && (
                  <div className="file-info">
                    <span>{selectedFile.name}</span>
                    <button
                      type="button"
                      className="btn-remove-file"
                      onClick={handleRemoveImage}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <p className="form-help-text">Upload an image for the collection's cover (max 5MB)</p>
            </div>

            {imagePreview && (
              <div className="image-preview-container">
                <label>Image Preview</label>
                <div className="image-preview">
                  <img 
                    src={imagePreview} 
                    alt="Collection preview"
                  />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Create Collection
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
                    className="btn-manage"
                    onClick={() => setSelectedCollection(collection)}
                  >
                    Manage
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

      {/* Collection Management Modal */}
      {selectedCollection && (
        <div className="collection-management-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedCollection.name}</h2>
              <button 
                className="close-button"
                onClick={() => {
                  setSelectedCollection(null);
                  setIsEditMode(false);
                  setActiveTab('details');
                  setFormData({ name: '', description: '', category: '' });
                  setImagePreview(null);
                  setSelectedFile(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="tabs">
              <button 
                className={activeTab === 'details' ? 'active' : ''}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button 
                className={activeTab === 'edit' ? 'active' : ''}
                onClick={() => setActiveTab('edit')}
              >
                Edit
              </button>
              <button 
                className={activeTab === 'curator' ? 'active' : ''}
                onClick={() => setActiveTab('curator')}
              >
                AI Curator
              </button>
              <button 
                className={activeTab === 'suggestions' ? 'active' : ''}
                onClick={() => setActiveTab('suggestions')}
              >
                Suggestions
              </button>
              <button 
                className={activeTab === 'items' ? 'active' : ''}
                onClick={() => setActiveTab('items')}
              >
                Items
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'details' && (
                <div className="collection-details">
                  <h3>Collection Details</h3>
                  <p><strong>ID:</strong> {selectedCollection.id}</p>
                  <p><strong>Created:</strong> {new Date(selectedCollection.created_at).toLocaleDateString()}</p>
                  {selectedCollection.metadata?.description && (
                    <p><strong>Description:</strong> {selectedCollection.metadata.description}</p>
                  )}
                  {selectedCollection.metadata?.category && (
                    <p><strong>Category:</strong> {selectedCollection.metadata.category}</p>
                  )}
                  <p><strong>Total Items:</strong> {selectedCollection.childrenCount || 0}</p>
                  <button 
                    className="btn-primary"
                    onClick={handleEditInModal}
                    style={{ marginTop: '20px' }}
                  >
                    Edit Collection
                  </button>
                </div>
              )}

              {activeTab === 'edit' && (
                <div className="collection-edit">
                  <form onSubmit={handleUpdateCollection} className="collection-form">
                    <div className="form-group">
                      <label htmlFor="modal-name">Collection Name *</label>
                      <input
                        type="text"
                        id="modal-name"
                        value={isEditMode ? formData.name : selectedCollection.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={!isEditMode}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="modal-description">Description</label>
                      <textarea
                        id="modal-description"
                        value={isEditMode ? formData.description : (selectedCollection.metadata?.description || '')}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows="4"
                        disabled={!isEditMode}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="modal-category">Category</label>
                      <input
                        type="text"
                        id="modal-category"
                        value={isEditMode ? formData.category : (selectedCollection.metadata?.category || '')}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        disabled={!isEditMode}
                      />
                    </div>

                    <div className="form-group">
                      <label>Collection Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        ref={fileInputRef}
                        disabled={!isEditMode}
                        style={{ display: 'none' }}
                      />
                      {!isEditMode ? (
                        imagePreview && (
                          <div className="image-preview">
                            <img 
                              src={imagePreview || selectedCollection.primaryImage?.url} 
                              alt="Collection preview"
                            />
                          </div>
                        )
                      ) : (
                        <>
                          <button 
                            type="button" 
                            className="btn-secondary"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {imagePreview ? 'Change Image' : 'Upload Image'}
                          </button>
                          {imagePreview && (
                            <>
                              <button 
                                type="button" 
                                className="btn-secondary"
                                onClick={handleRemoveImage}
                                style={{ marginLeft: '10px' }}
                              >
                                Remove Image
                              </button>
                              <div className="image-preview">
                                <img 
                                  src={imagePreview} 
                                  alt="Collection preview"
                                />
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    {isEditMode ? (
                      <div className="form-actions">
                        <button type="submit" className="btn-primary">
                          Save Changes
                        </button>
                        <button 
                          type="button" 
                          className="btn-secondary" 
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          handleEditInModal();
                        }}
                      >
                        Edit Collection
                      </button>
                    )}
                  </form>
                </div>
              )}

              {activeTab === 'curator' && (
                <CuratorConfig 
                  collectionId={selectedCollection.id}
                  collectionName={selectedCollection.name}
                />
              )}

              {activeTab === 'suggestions' && (
                <HierarchicalSuggestions 
                  collectionId={selectedCollection.id}
                />
              )}

              {activeTab === 'items' && (
                <div className="collection-items">
                  <h3>Collection Items</h3>
                  <p>Items management coming soon...</p>
                  {/* TODO: Add items management UI */}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionAdmin;