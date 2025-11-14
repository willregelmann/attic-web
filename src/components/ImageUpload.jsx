import { useState, useRef } from 'react';
import { Upload, X, GripVertical } from 'lucide-react';
import './ImageUpload.css';

/**
 * ImageUpload - Dropzone for uploading and managing multiple images
 *
 * @param {Array} existingImages - Array of {id, original, thumbnail}
 * @param {Function} onImagesChange - Callback(newFiles, removedIndices)
 * @param {Function} onReorder - Callback(newOrder) - array of image IDs
 * @param {Number} maxImages - Maximum number of images (default 10)
 */
export function ImageUpload({
  existingImages = [],
  onImagesChange,
  onReorder,
  maxImages = 10
}) {
  const [newFiles, setNewFiles] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const fileInputRef = useRef(null);

  // Combine existing and new images for display
  const allImages = [
    ...existingImages.map((img, idx) => ({ type: 'existing', index: idx, data: img })),
    ...newFiles.map((file, idx) => ({ type: 'new', index: idx, data: file }))
  ];

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} exceeds 5MB limit`);
        return false;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert(`${file.name} is not a supported format (JPEG, PNG, WebP only)`);
        return false;
      }
      return true;
    });

    if (allImages.length + validFiles.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    setNewFiles([...newFiles, ...validFiles]);
    if (onImagesChange) {
      onImagesChange([...newFiles, ...validFiles], []);
    }
  };

  const handleRemove = (imageObj) => {
    if (imageObj.type === 'existing') {
      // Remove existing image - notify parent
      if (onImagesChange) {
        onImagesChange(newFiles, [imageObj.index]);
      }
    } else {
      // Remove new file
      const updated = newFiles.filter((_, idx) => idx !== imageObj.index);
      setNewFiles(updated);
      if (onImagesChange) {
        onImagesChange(updated, []);
      }
    }
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event, dropIndex) => {
    event.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const reordered = [...allImages];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, draggedItem);

    // Extract order of existing images only
    const newOrder = reordered
      .filter(img => img.type === 'existing')
      .map(img => img.data.id);

    setDraggedIndex(null);
    if (onReorder && newOrder.length > 0) {
      onReorder(newOrder);
    }
  };

  // Helper to get image URL for display
  const getImageUrl = (imageObj) => {
    if (imageObj.type === 'existing') {
      // For existing images, use thumbnail path
      // Storage paths need to be converted to URLs
      const thumbnailPath = imageObj.data.thumbnail;
      // Assuming storage URLs are served at /storage/{path}
      return `/storage/${thumbnailPath}`;
    } else {
      // For new files, create blob URL
      return URL.createObjectURL(imageObj.data);
    }
  };

  return (
    <div className="image-upload">
      <div className="image-upload-grid">
        {allImages.map((imageObj, idx) => (
          <div
            key={`${imageObj.type}-${imageObj.index}`}
            className="image-upload-item"
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, idx)}
          >
            <div className="image-upload-drag-handle">
              <GripVertical size={16} />
            </div>
            <img
              src={getImageUrl(imageObj)}
              alt={`Upload ${idx + 1}`}
              className="image-upload-thumbnail"
            />
            <button
              type="button"
              className="image-upload-remove"
              onClick={() => handleRemove(imageObj)}
              aria-label="Remove image"
            >
              <X size={16} />
            </button>
            {idx === 0 && <span className="image-upload-primary">Primary</span>}
          </div>
        ))}

        {allImages.length < maxImages && (
          <div
            className="image-upload-dropzone"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={32} />
            <span>Add Images</span>
            <span className="image-upload-hint">
              {allImages.length}/{maxImages} • 5MB max • JPEG, PNG, WebP
            </span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
}
