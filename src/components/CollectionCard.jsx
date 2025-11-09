import { useState } from 'react';
import './CollectionCard.css';

/**
 * CollectionCard - Displays a user's custom collection
 * Shows representative images, name, and progress bar
 */
export function CollectionCard({ collection, onClick }) {
  const { name, progress, representative_images } = collection;

  // Use representative images if available, otherwise show placeholder
  const images = representative_images || [];
  const hasImages = images.length > 0;
  const hasMoreThanFour = images.length > 4;
  const displayImages = hasMoreThanFour ? images.slice(0, 4) : images;

  return (
    <div
      className="collection-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="collection-image">
        {!hasImages && (
          <div className="collection-placeholder">
            <svg viewBox="0 0 24 24" fill="none" width="48" height="48" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7l9-4 9 4M3 7h18"/>
            </svg>
          </div>
        )}

        {hasImages && images.length === 1 && (
          <div
            className="collection-single-image"
            style={{ backgroundImage: `url(${images[0]})` }}
          />
        )}

        {hasImages && images.length >= 2 && (
          <div className="collection-images-grid">
            {displayImages.map((imageUrl, idx) => (
              <div
                key={idx}
                className={`collection-grid-image ${hasMoreThanFour && idx === 3 ? 'has-more' : ''}`}
                style={{ backgroundImage: `url(${imageUrl})` }}
              >
                {hasMoreThanFour && idx === 3 && (
                  <div className="more-indicator">
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                      <circle cx="4" cy="12" r="2" fill="white"/>
                      <circle cx="12" cy="12" r="2" fill="white"/>
                      <circle cx="20" cy="12" r="2" fill="white"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="collection-content">
        <h4 className="collection-name">{name}</h4>

        {progress && (
          <div className="collection-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <div className="progress-text">
              {progress.owned_count}/{progress.total_count} items ({Math.round(progress.percentage)}%)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
