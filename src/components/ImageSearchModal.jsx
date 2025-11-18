import { useState, useRef } from 'react';
import { X, Upload as UploadIcon, Search, Loader } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { SEARCH_BY_IMAGE } from '../queries';
import { useSearch } from '../contexts/SearchContext';
import { Modal, ModalButton } from './Modal';

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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Search by Image"
      size="md"
      showCloseButton={true}
      footer={
        <>
          <ModalButton onClick={handleClose} disabled={loading}>
            Cancel
          </ModalButton>
          <ModalButton
            onClick={handleSearch}
            variant="primary"
            disabled={!imageFile || loading}
          >
            {loading ? (
              <>
                <Loader size={16} className="animate-spin inline mr-2" />
                Searching...
              </>
            ) : (
              <>
                <Search size={16} className="inline mr-2" />
                Search
              </>
            )}
          </ModalButton>
        </>
      }
    >
      <p className="text-[var(--text-secondary)] text-center mb-4">
        Upload a photo to find visually similar items
      </p>

      {!imagePreview ? (
        <div
          className={`border-2 border-dashed rounded-lg py-12 px-8 md:px-4 text-center cursor-pointer transition-all mb-6 ${
            isDragging
              ? 'border-[var(--primary)] bg-[var(--bg-tertiary)]'
              : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--primary)] hover:bg-[var(--bg-tertiary)]'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon size={48} className="text-[var(--text-secondary)] mb-4 mx-auto" />
          <p className="m-0 mb-2 text-[var(--text-primary)] text-[15px]">
            <span className="hidden md:inline">Drag and drop an image here, or click to browse</span>
            <span className="md:hidden">Tap to select an image</span>
          </p>
          <p className="m-0 text-[var(--text-secondary)] text-sm">
            Supports JPG, PNG, and WebP (max 10MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            capture="environment"
          />
        </div>
      ) : (
        <div className="relative mb-6 rounded-lg overflow-hidden">
          <img
            src={imagePreview}
            alt="Selected image"
            className="w-full h-auto max-h-[400px] object-contain block bg-[var(--bg-secondary)]"
          />
          <button
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 border-none text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-colors"
            onClick={clearImage}
            title="Remove image"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </Modal>
  );
}
