import { useState } from 'react';

/**
 * RadialMenu - A mobile-friendly floating action button menu
 * that expands into a radial arrangement of action buttons
 *
 * @param {Array} actions - Array of action objects with { icon, label, onClick, id, disabled, variant, testid }
 *   - icon: FontAwesome class string (e.g., "fas fa-search") or React element
 *   - label: Aria label and title text
 *   - onClick: Callback function
 *   - id: Unique identifier (optional)
 *   - disabled: Whether the action is disabled (optional)
 *   - variant: Visual variant: 'default', 'danger', etc. (optional)
 *   - testid: data-testid attribute value (optional)
 * @param {Object} mainButton - Optional action object for direct action mode (replaces menu with single button)
 *   - Same structure as actions: { icon, label, onClick, variant, disabled }
 * @param {Function} onBackdropClick - Callback when backdrop is clicked
 * @param {Boolean} showOnDesktop - Whether to show menu on desktop (default: false)
 */
const RadialMenu = ({
  actions = [],
  mainButton = null,
  onBackdropClick,
  showOnDesktop = false
}) => {
  const [isActive, setIsActive] = useState(false);

  const toggleMenu = () => {
    setIsActive(!isActive);
  };

  // Default menu button - toggles the radial menu
  const defaultMainButton = {
    icon: isActive ? 'fas fa-times' : 'fas fa-briefcase',
    label: isActive ? 'Close menu' : 'Open menu',
    onClick: toggleMenu,
    variant: 'default',
    disabled: false,
    isMenuToggle: true // Special flag for menu toggle behavior
  };

  // Use provided mainButton or default
  const activeMainButton = mainButton || defaultMainButton;
  const isMenuMode = activeMainButton.isMenuToggle === true;

  const handleMainButtonClick = () => {
    if (activeMainButton.onClick) {
      activeMainButton.onClick();
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

  const getMainButtonLabel = () => {
    return activeMainButton.label;
  };

  // Get main button classes based on variant and mode
  const getMainButtonClasses = () => {
    const base = `flex items-center justify-center rounded-full border-none cursor-pointer relative z-[1002] transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.1)] w-[4.5rem] h-[4.5rem] max-[480px]:w-[4.5rem] max-[480px]:h-[4.5rem] sm:w-28 sm:h-28 hover:scale-110 hover:shadow-[0_6px_16px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] active:scale-95 focus-visible:outline-3 focus-visible:outline-[#F5C842] focus-visible:outline-offset-[3px] motion-reduce:transition-none`;

    // Variant-specific colors
    const variant = activeMainButton.variant || 'default';
    let colors;
    if (variant === 'save') {
      colors = 'bg-emerald-500 text-white hover:bg-emerald-600';
    } else if (variant === 'danger') {
      colors = 'bg-red-500 text-white hover:bg-red-600';
    } else {
      // Default navy/yellow theme
      colors = 'bg-[#2C4B7B] text-[#F5C842] hover:bg-[#3a5e98]';
    }

    // Active state rotation (menu mode only)
    const activeState = isMenuMode && isActive
      ? 'rotate-[135deg] bg-[#F5C842]'
      : '';

    return `${base} ${colors} ${activeState}`;
  };

  // Get menu item classes
  const getMenuItemClasses = (action, index) => {
    const base = `absolute flex items-center justify-center rounded-full border-2 cursor-pointer z-[1001] bottom-1 right-1 transition-all duration-300 focus-visible:outline-3 focus-visible:outline-[#F5C842] focus-visible:outline-offset-[3px] motion-reduce:transition-none w-16 h-16 max-[480px]:w-16 max-[480px]:h-16 sm:w-[4.5rem] sm:h-[4.5rem]`;

    // Inactive state
    const inactive = 'opacity-0 scale-0 pointer-events-none';

    // Active state (will be combined with transform via style prop)
    const active = 'opacity-100 scale-100 pointer-events-auto';

    // Variant colors
    let colors;
    if (action.variant === 'danger' || action.className?.includes('linked-collection')) {
      colors = 'bg-red-500 border-red-500 text-white hover:bg-red-600 hover:border-red-600 hover:shadow-[0_4px_14px_rgba(239,68,68,0.4)]';
    } else {
      colors = 'bg-[#2C4B7B] text-white border-[#F5C842] shadow-[0_3px_10px_rgba(0,0,0,0.15)] hover:scale-[1.15] hover:bg-[#F5C842] hover:text-[#2C4B7B] hover:border-[#F5C842] hover:shadow-[0_4px_14px_rgba(245,200,66,0.4)]';
    }

    return `${base} ${colors} ${isActive ? active : inactive}`;
  };

  // Calculate inline transform style for menu items
  const getItemStyle = (index, total) => {
    if (!isActive) return {};

    // Positions: 11rem radius, adjusted angles based on count
    // Mobile uses 9rem radius via max-[480px] classes won't work in inline styles
    // So we'll use CSS custom property or just accept the desktop size
    const positions = {
      1: [
        { x: 0, y: -11 }
      ],
      2: [
        { x: 0, y: -11 },
        { x: -7.78, y: -7.78 }
      ],
      3: [
        { x: 0, y: -11 },
        { x: -5.5, y: -9.53 },
        { x: -9.53, y: -5.5 }
      ],
      4: [
        { x: 0, y: -11 },
        { x: -5.5, y: -9.53 },
        { x: -9.53, y: -5.5 },
        { x: -11, y: 0 }
      ]
    };

    const pos = positions[Math.min(total, 4)]?.[index] || { x: 0, y: -11 };
    return {
      transform: `translate(${pos.x}rem, ${pos.y}rem) scale(1)`,
      transitionDelay: `${0.05 * (index + 1)}s`
    };
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-[2100] max-[480px]:bottom-4 max-[480px]:right-4 ${
        showOnDesktop ? '' : 'md:hidden'
      }`}
    >
      {/* Floating Action Button */}
      <button
        className={getMainButtonClasses()}
        onClick={handleMainButtonClick}
        aria-label={getMainButtonLabel()}
        aria-expanded={isMenuMode ? isActive : undefined}
        data-testid={isMenuMode ? 'radial-menu-trigger' : 'fab'}
        disabled={activeMainButton.disabled}
      >
        <i className={`${activeMainButton.icon} text-[22px] sm:text-4xl transition-transform duration-300 ${
          isMenuMode && isActive
            ? 'text-[#2C4B7B] -rotate-[135deg]'
            : isMenuMode
              ? 'text-[#F5C842]'
              : ''
        } ${!isMenuMode || !isActive ? 'hover:scale-110' : ''}`}></i>
      </button>

      {/* Menu Items - only shown in menu mode */}
      {isMenuMode && (
        <nav className="absolute bottom-0 right-0 m-0 p-0 list-none" aria-label="Radial menu" data-testid="radial-menu">
          {actions.map((action, index) => (
            <button
              key={action.id || index}
              className={getMenuItemClasses(action, index)}
              style={getItemStyle(index, actions.length)}
              onClick={() => handleMenuItemClick(action.onClick)}
              aria-label={action.label}
              title={action.label}
              disabled={action.disabled || false}
              data-testid={action.testid}
            >
              {typeof action.icon === 'string' ? (
                <i className={`${action.icon} text-[1.4rem] sm:text-2xl transition-transform duration-200`}></i>
              ) : (
                action.icon
              )}
            </button>
          ))}
        </nav>
      )}

      {/* Backdrop - closes menu when clicking outside (only in menu mode) */}
      {isMenuMode && isActive && (
        <div
          className="fixed inset-0 bg-black/30 z-[999] animate-[fadeIn_0.3s_ease] backdrop-blur-sm motion-reduce:animate-none"
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

export default RadialMenu;
