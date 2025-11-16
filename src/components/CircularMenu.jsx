import { useState } from 'react';
import './CircularMenu.css';

/**
 * CircularMenu - A mobile-friendly floating action button menu
 * that expands into a circular arrangement of action buttons
 *
 * @param {Array} actions - Array of action objects with { icon, label, onClick, id, disabled, variant, testid }
 *   - icon: FontAwesome class string (e.g., "fas fa-search") or React element
 *   - label: Aria label and title text
 *   - onClick: Callback function
 *   - id: Unique identifier (optional)
 *   - disabled: Whether the action is disabled (optional)
 *   - variant: Visual variant: 'default', 'danger', etc. (optional)
 *   - testid: data-testid attribute value (optional)
 * @param {Function} onBackdropClick - Callback when backdrop is clicked
 * @param {Boolean} showOnDesktop - Whether to show menu on desktop (default: false)
 * @param {String} mainButtonMode - 'menu' (default) or 'action' for direct action button
 * @param {String} mainButtonIcon - Icon for main button in action mode (e.g., "fas fa-save")
 * @param {String} mainButtonLabel - Label for main button in action mode
 * @param {Function} mainButtonOnClick - Click handler for main button in action mode
 * @param {String} mainButtonVariant - Visual variant: 'default', 'save', 'danger', etc.
 */
const CircularMenu = ({
  actions = [],
  onBackdropClick,
  showOnDesktop = false,
  mainButtonMode = 'menu',
  mainButtonIcon = null,
  mainButtonLabel = null,
  mainButtonOnClick = null,
  mainButtonVariant = 'default'
}) => {
  const [isActive, setIsActive] = useState(false);

  const toggleMenu = () => {
    setIsActive(!isActive);
  };

  const handleMainButtonClick = () => {
    if (mainButtonMode === 'action' && mainButtonOnClick) {
      // Direct action mode - execute the callback
      mainButtonOnClick();
    } else {
      // Menu mode - toggle menu
      toggleMenu();
    }
  };

  const handleMenuItemClick = (callback) => {
    // Close menu after action
    setIsActive(false);

    // Execute the callback if provided
    if (callback && typeof callback === 'function') {
      callback();
    }
  };

  // Determine main button icon and label
  const getMainButtonIcon = () => {
    if (mainButtonMode === 'action' && mainButtonIcon) {
      return <i className={mainButtonIcon}></i>;
    }
    // Menu mode
    return isActive ? (
      <i className="fas fa-times"></i>
    ) : (
      <i className="fas fa-briefcase briefcase-icon"></i>
    );
  };

  const getMainButtonLabel = () => {
    if (mainButtonMode === 'action' && mainButtonLabel) {
      return mainButtonLabel;
    }
    return isActive ? 'Close menu' : 'Open menu';
  };

  return (
    <div
      className={`circular-menu ${isActive ? 'active' : ''} ${showOnDesktop ? 'show-desktop' : ''} ${mainButtonMode === 'action' ? 'action-mode' : ''}`}
    >
      {/* Floating Action Button */}
      <button
        className={`floating-btn ${mainButtonVariant !== 'default' ? `floating-btn-${mainButtonVariant}` : ''}`}
        onClick={handleMainButtonClick}
        aria-label={getMainButtonLabel()}
        aria-expanded={mainButtonMode === 'menu' ? isActive : undefined}
        data-testid={mainButtonMode === 'menu' ? 'circular-menu-trigger' : 'fab'}
      >
        {getMainButtonIcon()}
      </button>

      {/* Menu Items - only shown in menu mode */}
      {mainButtonMode === 'menu' && (
        <nav className="items-wrapper" aria-label="Circular menu" data-testid="circular-menu">
          {actions.map((action, index) => (
            <button
              key={action.id || index}
              className={`menu-item ${action.variant ? `menu-item-${action.variant}` : ''} ${action.className || ''}`}
              onClick={() => handleMenuItemClick(action.onClick)}
              aria-label={action.label}
              title={action.label}
              disabled={action.disabled || false}
              data-testid={action.testid}
            >
              {typeof action.icon === 'string' ? (
                <i className={action.icon}></i>
              ) : (
                action.icon
              )}
            </button>
          ))}
        </nav>
      )}

      {/* Backdrop - closes menu when clicking outside (only in menu mode) */}
      {mainButtonMode === 'menu' && isActive && (
        <div
          className="circular-menu-backdrop"
          onClick={() => {
            setIsActive(false);
            if (onBackdropClick) {
              onBackdropClick();
            }
          }}
          aria-hidden="true"
          data-testid="menu-backdrop"
        />
      )}
    </div>
  );
};

export default CircularMenu;
