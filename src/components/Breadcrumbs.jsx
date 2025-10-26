import { useNavigate } from 'react-router-dom';
import './ItemList.css'; // Breadcrumb styles are defined here

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
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol className="breadcrumb-list">
          <li className="breadcrumb-item">
            <span className="breadcrumb-skeleton"></span>
          </li>
          <li className="breadcrumb-separator" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </li>
          <li className="breadcrumb-item">
            <span className="breadcrumb-skeleton"></span>
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
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isClickable = item.path || item.onClick;

          return (
            <li key={index} className="breadcrumb-item">
              {index > 0 && (
                <span className="breadcrumb-separator" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}

              {isLast || !isClickable ? (
                <div className="breadcrumb-current" aria-current={isLast ? "page" : undefined}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              ) : (
                <button
                  className="breadcrumb-link"
                  onClick={() => handleClick(item)}
                >
                  {item.icon}
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
