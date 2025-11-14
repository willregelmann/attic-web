import { useState, useRef, useEffect } from 'react';
import { Upload, X, GripVertical, Camera } from 'lucide-react';
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
  const [displayImages, setDisplayImages] = useState([]);
  const [removedIndices, setRemovedIndices] = useState([]);
  const fileInputRef = useRef(null);
  const draggedIndexRef = useRef(null);

  // Combine existing and new images for display, filtering out removed ones
  const allImages = [
    ...existingImages
      .map((img, originalIdx) => ({ img, originalIdx })) // Track original index
      .filter(({ originalIdx }) => !removedIndices.includes(originalIdx))
      .map(({ img, originalIdx }) => ({
        type: 'existing',
        index: originalIdx, // Use original index for removal
        data: img
      })),
    ...newFiles.map((file, idx) => ({ type: 'new', index: idx, data: file }))
  ];

  // Update display images when props change
  useEffect(() => {
    // Always update displayImages to reflect current state (including removals)
    setDisplayImages(allImages);
  }, [existingImages, newFiles, removedIndices]);

  // Separate effect to reset removedIndices when existingImages changes (new item loaded)
  useEffect(() => {
    setRemovedIndices([]);
  }, [existingImages]);

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
      onImagesChange([...newFiles, ...validFiles], removedIndices);
    }
  };

  const handleRemove = (imageObj) => {
    if (imageObj.type === 'existing') {
      // Remove existing image - track locally and notify parent
      const updatedRemoved = [...removedIndices, imageObj.index];
      setRemovedIndices(updatedRemoved);
      if (onImagesChange) {
        onImagesChange(newFiles, updatedRemoved);
      }
    } else {
      // Remove new file
      const updated = newFiles.filter((_, idx) => idx !== imageObj.index);
      setNewFiles(updated);
      if (onImagesChange) {
        onImagesChange(updated, removedIndices);
      }
    }
  };

  const handleDragStart = (event, index) => {
    draggedIndexRef.current = index;
    setDraggedIndex(index);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event, dropIndex) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const dragIndex = draggedIndexRef.current;
    if (dragIndex === null || dragIndex === dropIndex) {
      return;
    }

    // Create live preview by reordering display array
    const reordered = [...displayImages];
    const [draggedItem] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, draggedItem);

    setDisplayImages(reordered);
    draggedIndexRef.current = dropIndex; // Update ref to new position
  };

  const handleDragEnd = () => {
    draggedIndexRef.current = null;
    setDraggedIndex(null);
  };

  const handleDrop = (event, dropIndex) => {
    event.preventDefault();
    event.stopPropagation();

    // Display is already reordered from dragOver, just notify parent
    const newOrder = displayImages
      .filter(img => img.type === 'existing')
      .map(img => img.data.id);

    if (onReorder && newOrder.length > 0) {
      onReorder(newOrder);
    }

    // Clean up drag state
    draggedIndexRef.current = null;
    setDraggedIndex(null);
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
        {displayImages.map((imageObj, idx) => (
          <div
            key={`${imageObj.type}-${imageObj.index}-${idx}`}
            className={`image-upload-item ${draggedIndex === idx ? 'dragging' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, idx)}
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

        {displayImages.length < maxImages && (
          <div
            className="image-upload-dropzone"
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Camera size={28} />
              <Upload size={28} />
            </div>
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
        capture="environment"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
}
