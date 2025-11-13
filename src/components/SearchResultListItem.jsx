import { useNavigate } from 'react-router-dom';
import { isCollectionType, formatEntityType } from '../utils/formatters';
import './SearchResultListItem.css';

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
      className="search-result-list-item"
      onClick={handleClick}
      data-testid={`search-result-${item.id}`}
    >
      <div className="search-result-list-thumbnail">
        {(item.thumbnail_url || item.image_url) ? (
          <img
            src={item.thumbnail_url || item.image_url}
            alt={item.name}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="search-result-list-emoji"
          style={{ display: (item.thumbnail_url || item.image_url) ? 'none' : 'flex' }}
        >
          {isCollectionType(item.type) ? '📦' : '🎴'}
        </div>
      </div>

      <div className="search-result-list-details">
        <div className="search-result-list-name">{item.name}</div>
        <div className="search-result-list-meta">
          <span className="search-result-list-type">{formatEntityType(item.type)}</span>
          {item.year && <span className="search-result-list-year"> • {item.year}</span>}
          {item.country && (
            <span className="search-result-list-country"> • {item.country}</span>
          )}
        </div>
      </div>
    </button>
  );
}

export default SearchResultListItem;
