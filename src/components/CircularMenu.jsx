import { useState } from 'react';
import './CircularMenu.css';

/**
 * CircularMenu - A mobile-friendly floating action button menu
 * that expands into a circular arrangement of action buttons
 *
 * @param {Function} onAddToCollection - Callback when "Add to Collection" is clicked
 * @param {Function} onSearch - Callback when "Search" is clicked
 * @param {Function} onAccount - Callback when "My Account" is clicked
 * @param {Function} onFilter - Callback when "Filter" is clicked
 * @param {Function} onBackdropClick - Callback when backdrop is clicked
 * @param {Boolean} showOnDesktop - Whether to show menu on desktop (default: false)
 * @param {Boolean} showFilter - Whether to show the filter button (default: false)
 */
const CircularMenu = ({ onAddToCollection, onSearch, onAccount, onFilter, onBackdropClick, showOnDesktop = false, showFilter = false }) => {
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

        {/* Filter (conditional) */}
        {showFilter && (
          <button
            className="menu-item"
            onClick={() => handleMenuItemClick(onFilter)}
            aria-label="Filter collection"
            title="Filter collection"
          >
            <i className="fas fa-filter"></i>
          </button>
        )}

        {/* My Account */}
        <button
          className="menu-item"
          onClick={() => handleMenuItemClick(onAccount)}
          aria-label="My account"
          title="My account"
        >
          <i className="fas fa-user"></i>
        </button>
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
