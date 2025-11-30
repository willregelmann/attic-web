import { useNavigate } from 'react-router-dom';

/**
 * Breadcrumbs component for navigation trail
 * @param {Array} items - Array of breadcrumb items: [{ label, icon?, path?, onClick? }]
 * @param {boolean} loading - Show loading skeleton
 */
function Breadcrumbs({ items = [], loading = false }) {
  const navigate = useNavigate();

  // Loading state
  if (loading) {
    return (
      <nav className="!py-3 !px-8 bg-[var(--bg-primary)] border-b border-[var(--border-color)] sticky top-16 z-[100] hidden md:block" aria-label="Breadcrumb">
        <ol className="flex items-center list-none max-w-[1400px] m-0 p-0 gap-2">
          <li className="flex items-center gap-2">
            <span className="inline-block w-20 h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] motion-safe:animate-shimmer motion-reduce:bg-gray-100 motion-reduce:dark:bg-gray-700 rounded"></span>
          </li>
          <li className="flex items-center gap-2 text-[var(--text-secondary)] opacity-50" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block w-20 h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] motion-safe:animate-shimmer motion-reduce:bg-gray-100 motion-reduce:dark:bg-gray-700 rounded"></span>
          </li>
        </ol>
      </nav>
    );
  }

  const handleClick = (item) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <nav className="!py-3 !px-8 bg-[var(--bg-primary)] border-b border-[var(--border-color)] sticky top-16 z-[100] hidden md:block" aria-label="Breadcrumb">
      <ol className="flex items-center list-none max-w-[1400px] m-0 p-0 gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isClickable = item.path || item.onClick;

          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <span className="flex items-center text-[var(--text-secondary)] opacity-50" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}

              {isLast || !isClickable ? (
                <div className="flex items-center gap-1.5 text-[var(--text-primary)] text-sm font-semibold py-1.5 px-3" aria-current={isLast ? "page" : undefined}>
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
              ) : (
                <button
                  className="flex items-center gap-1.5 py-1.5 px-3 bg-transparent text-[var(--text-secondary)] border-none cursor-pointer text-sm font-medium transition-all duration-200 rounded-md hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                  onClick={() => handleClick(item)}
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
