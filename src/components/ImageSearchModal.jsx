import { useState, useRef } from 'react';
import { X, Camera, Upload as UploadIcon, Search, Loader } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { SEARCH_BY_IMAGE } from '../queries';
import { useSearch } from '../contexts/SearchContext';
import './ImageSearchModal.css';

/**
 * ImageSearchModal - Upload an image to search for visually similar items
 *
 * @param {boolean} isOpen - Whether modal is visible
 * @param {Function} onClose - Close modal callback
 */
export function ImageSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { handleImageSelect, imageFile, imagePreview, clearImage, updateSearchResults, startSearch } = useSearch();

  const [isDragging, setIsDragging] = useState(false);
  const [searchByImage, { loading }] = useMutation(SEARCH_BY_IMAGE);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageSelect(file);
    }
  };

  const handleSearch = async () => {
    if (!imageFile) return;

    try {
      startSearch();
      const { data } = await searchByImage({
        variables: {
          image: imageFile,
          limit: 20,
          minSimilarity: 0.75,
        },
      });

      updateSearchResults(data.searchByImage);
      onClose();
      clearImage();
      navigate('/search');
    } catch (error) {
      console.error('Image search error:', error);
      alert('Failed to search by image. Please try again.');
    }
  };

  const handleClose = () => {
    clearImage();
    onClose();
  };

  return (
    <div className="image-search-modal-overlay" onClick={handleClose}>
      <div className="image-search-modal" onClick={(e) => e.stopPropagation()}>
        <button className="image-search-close" onClick={handleClose}>
          <X size={24} />
        </button>

        <h2>Search by Image</h2>
        <p className="image-search-subtitle">
          Upload a photo to find visually similar items
        </p>

        {!imagePreview ? (
          <div
            className={`image-search-dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon size={48} className="image-search-icon" />
            <p className="image-search-dropzone-text">
              <span className="desktop-only">Drag and drop an image here, or click to browse</span>
              <span className="mobile-only">Tap to select an image</span>
            </p>
            <p className="image-search-hint">
              Supports JPG, PNG, and WebP (max 10MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              capture="environment" // Enable camera on mobile
            />
          </div>
        ) : (
          <div className="image-search-preview">
            <img
              src={imagePreview}
              alt="Selected image"
              className="image-search-preview-img"
            />
            <button
              className="image-search-remove-btn"
              onClick={clearImage}
              title="Remove image"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div className="image-search-actions">
          <button
            className="image-search-btn secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="image-search-btn primary"
            onClick={handleSearch}
            disabled={!imageFile || loading}
          >
            {loading ? (
              <>
                <Loader size={16} className="spinning" />
                Searching...
              </>
            ) : (
              <>
                <Search size={16} />
                Search
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
