import { useState, useRef, useEffect } from 'react';
import { Upload, X, GripVertical, Camera } from 'lucide-react';

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
    <div className="m-0">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(110px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3 max-w-full overflow-hidden p-1">
        {displayImages.map((imageObj, idx) => (
          <div
            key={`${imageObj.type}-${imageObj.index}-${idx}`}
            className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-move transition-transform max-h-[150px] h-full ${
              draggedIndex === idx
                ? 'opacity-50 border-gray-300'
                : 'border-gray-200 hover:scale-105 hover:border-blue-500'
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            data-testid="image-preview"
          >
            <div
              className="absolute top-1 left-1 bg-black/60 text-white rounded p-0.5 cursor-grab active:cursor-grabbing z-[2] select-none"
              data-testid="drag-handle"
            >
              <GripVertical size={16} />
            </div>
            <img
              src={getImageUrl(imageObj)}
              alt={`Upload ${idx + 1}`}
              className="w-full h-full object-contain"
            />
            <button
              type="button"
              className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 border-none text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer z-[2]"
              onClick={() => handleRemove(imageObj)}
              aria-label="Remove image"
              data-testid="remove-image-btn"
            >
              <X size={16} />
            </button>
            {idx === 0 && (
              <span
                className="absolute bottom-1 left-1 bg-blue-500/90 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold"
                data-testid="primary-image-badge"
              >
                Primary
              </span>
            )}
          </div>
        ))}

        {displayImages.length < maxImages && (
          <div
            className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all text-slate-500 max-h-[150px] h-full hover:border-blue-500 hover:bg-slate-100 hover:text-blue-500"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex gap-2 items-center">
              <Camera size={28} />
              <Upload size={28} />
            </div>
            <span className="text-xs mt-1">Add Images</span>
            <span className="text-[11px] mt-1 text-center">
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
        data-testid="image-upload"
      />
    </div>
  );
}
