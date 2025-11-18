/**
 * IconButton - Reusable icon button component
 *
 * Renders a button from an action object. Used for consistent button styling
 * across desktop and mobile interfaces.
 *
 * @param {Object} action - Action object defining the button
 *   @param {string} action.id - Unique identifier
 *   @param {string|ReactElement} action.icon - FontAwesome class (e.g., "fas fa-search") or React element (SVG)
 *   @param {string} action.label - Accessible label and tooltip text
 *   @param {Function} action.onClick - Click handler
 *   @param {boolean} action.disabled - Whether button is disabled (optional)
 *   @param {string} action.variant - Visual variant: 'active', 'danger', 'success' (optional)
 *   @param {string} action.className - Additional CSS classes (optional)
 *   @param {string} action.testid - data-testid attribute (optional)
 *   @param {ReactElement} action.badge - Badge element to display (optional)
 * @param {string} className - Additional CSS classes to apply to the button
 */
export function IconButton({ action, className = '' }) {
  // Base button styles
  const baseClasses = 'relative inline-flex items-center justify-center min-w-[36px] min-h-[36px] px-3 py-2 rounded-lg border transition-all duration-200 cursor-pointer';

  // Default variant styles
  const defaultClasses = 'bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15 text-gray-600 dark:text-gray-400 hover:bg-black/8 dark:hover:bg-white/8 hover:border-black/20 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-gray-100';

  // Active variant (yellow accent for filters)
  const activeClasses = 'bg-yellow-400 border-yellow-400 text-blue-900 hover:bg-yellow-400 hover:border-yellow-400 hover:text-blue-900';

  // Danger variant (red for delete actions)
  const dangerClasses = 'bg-red-600/10 border-red-600/30 text-red-600 hover:bg-red-600/20 hover:border-red-600/50 hover:text-red-600';

  // Success variant (emerald for save actions)
  const successClasses = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/15 hover:border-emerald-500/40 hover:text-emerald-500';

  // Disabled styles
  const disabledClasses = 'disabled:opacity-50 disabled:cursor-not-allowed';

  // Select variant classes
  const variantClasses = action.variant === 'active'
    ? activeClasses
    : action.variant === 'danger'
    ? dangerClasses
    : action.variant === 'success'
    ? successClasses
    : defaultClasses;

  const buttonClasses = [
    baseClasses,
    variantClasses,
    disabledClasses,
    action.className || '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClasses}
      onClick={action.onClick}
      disabled={action.disabled}
      title={action.label}
      aria-label={action.label}
      data-testid={action.testid}
    >
      {typeof action.icon === 'string' ? (
        <i className={action.icon}></i>
      ) : (
        action.icon
      )}
      {action.badge && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 text-blue-900 rounded-full flex items-center justify-center text-[8px] font-semibold">
          {action.badge}
        </span>
      )}
    </button>
  );
}
