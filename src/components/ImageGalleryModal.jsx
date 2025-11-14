import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import './ImageGalleryModal.css';

/**
 * ImageGalleryModal - View, add, remove, and reorder images
 *
 * @param {Object} item - UserItem with images array [{id, original, thumbnail}]
 * @param {Function} onClose - Close modal callback
 * @param {Function} onUpdate - Update images callback(newFiles, removeIndices, reorderIds)
 */
export function ImageGalleryModal({ item, onClose, onUpdate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isManaging, setIsManaging] = useState(false);

  const images = item.images || [];
  const currentImage = images[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="image-gallery-modal-overlay" onClick={onClose}>
      <div className="image-gallery-modal" onClick={(e) => e.stopPropagation()}>
        <button className="image-gallery-close" onClick={onClose}>
          <X size={24} />
        </button>

        {!isManaging && images.length > 0 ? (
          <>
            <div className="image-gallery-viewer">
              <img
                src={currentImage.original}
                alt={`Image ${currentIndex + 1}`}
                className="image-gallery-main"
              />

              {images.length > 1 && (
                <>
                  <button className="image-gallery-nav prev" onClick={handlePrevious}>
                    <ChevronLeft size={32} />
                  </button>
                  <button className="image-gallery-nav next" onClick={handleNext}>
                    <ChevronRight size={32} />
                  </button>
                </>
              )}
            </div>

            <div className="image-gallery-footer">
              <span className="image-gallery-counter">
                {currentIndex + 1} / {images.length}
              </span>
              <button
                className="image-gallery-manage-btn"
                onClick={() => setIsManaging(true)}
              >
                Manage Images
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Manage Images</h2>
            <ImageUpload
              existingImages={images}
              onImagesChange={onUpdate}
              onReorder={(newOrder) => onUpdate([], [], newOrder)}
              maxImages={10}
            />
            <button
              className="image-gallery-done-btn"
              onClick={() => setIsManaging(false)}
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
