import { useNavigate } from 'react-router-dom';
import { isCollectionType, formatEntityType } from '../utils/formatters';

function SearchResultListItem({ item, onItemClick }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onItemClick) {
      onItemClick(item);
    } else {
      // Default behavior
      if (isCollectionType(item.type)) {
        navigate(`/collection/${item.id}`);
      } else {
        navigate(`/item/${item.id}`);
      }
    }
  };

  return (
    <button
      className="flex items-center gap-4 py-3 px-4 bg-transparent border-none border-b border-[var(--border-color)] cursor-pointer transition-colors duration-200 text-left w-full last:border-b-0 hover:bg-[var(--bg-secondary)]"
      onClick={handleClick}
      data-testid={`search-result-${item.id}`}
    >
      <div className="w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-lg overflow-hidden bg-[var(--bg-secondary)] relative flex items-center justify-center">
        {(item.thumbnail_url || item.image_url) ? (
          <img
            src={item.thumbnail_url || item.image_url}
            alt={item.name}
            className="w-full h-full object-contain block"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="text-2xl md:text-[2rem] leading-none"
          style={{ display: (item.thumbnail_url || item.image_url) ? 'none' : 'flex' }}
        >
          {isCollectionType(item.type) ? '📦' : '🎴'}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-base md:text-[1.05rem] font-semibold text-[var(--text-primary)] mb-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
          {item.name}
        </div>
        <div className="text-[0.85rem] md:text-[0.9rem] text-[var(--text-secondary)] flex items-center flex-wrap gap-1">
          <span className="font-medium">{formatEntityType(item.type)}</span>
          {item.year && <span> • {item.year}</span>}
          {item.country && <span> • {item.country}</span>}
        </div>
      </div>
    </button>
  );
}

export default SearchResultListItem;
