import { useState } from 'react';
import './CircularMenu.css';

/**
 * CircularMenu - A mobile-friendly floating action button menu
 * that expands into a circular arrangement of action buttons
 *
 * @param {Function} onAddToCollection - Callback when "Add to Collection" is clicked
 * @param {Function} onSearch - Callback when "Search" is clicked
 * @param {Function} onBackdropClick - Callback when backdrop is clicked
 * @param {Boolean} showOnDesktop - Whether to show menu on desktop (default: false)
 */
const CircularMenu = ({ onAddToCollection, onSearch, onBackdropClick, showOnDesktop = false }) => {
  const [isActive, setIsActive] = useState(false);

  const toggleMenu = () => {
    setIsActive(!isActive);
  };

  const handleMenuItemClick = (callback) => {
    // Close menu after action
    setIsActive(false);

    // Execute the callback if provided
    if (callback && typeof callback === 'function') {
      callback();
    }
  };

  return (
    <div
      className={`circular-menu ${isActive ? 'active' : ''} ${showOnDesktop ? 'show-desktop' : ''}`}
    >
      {/* Floating Action Button */}
      <button
        className="floating-btn"
        onClick={toggleMenu}
        aria-label={isActive ? 'Close menu' : 'Open menu'}
        aria-expanded={isActive}
      >
        {isActive ? (
          <i className="fas fa-times"></i>
        ) : (
          <i className="fas fa-briefcase briefcase-icon"></i>
        )}
      </button>

      {/* Menu Items */}
      <nav className="items-wrapper" aria-label="Circular menu">
        {/* Add to Collection */}
        <button
          className="menu-item"
          onClick={() => handleMenuItemClick(onAddToCollection)}
          aria-label="Add to collection"
          title="Add to collection"
        >
          <i className="fas fa-plus-circle"></i>
        </button>

        {/* Search */}
        <button
          className="menu-item"
          onClick={() => handleMenuItemClick(onSearch)}
          aria-label="Search"
          title="Search"
        >
          <i className="fas fa-search"></i>
        </button>

        {/* Placeholder for future actions */}
        {/* Add more menu items here as needed */}
      </nav>

      {/* Backdrop - closes menu when clicking outside */}
      {isActive && (
        <div
          className="circular-menu-backdrop"
          onClick={() => {
            setIsActive(false);
            if (onBackdropClick) {
              onBackdropClick();
            }
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default CircularMenu;
