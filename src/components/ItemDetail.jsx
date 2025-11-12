import ItemDetailContent from './ItemDetailContent';
import './ItemDetail.css';

function ItemDetail({
  item,
  index,
  isOwned,
  onToggleOwnership,
  onClose,
  onNavigateToCollection,
  collection,
  isSuggestionPreview = false,
  onAcceptSuggestion,
  onRejectSuggestion,
  isUserItem = false,
  showAsWishlist = false,
  currentCollection = null,
  externalEditMode = false,
  onEditModeChange = null,
  externalAddMode = false,
  onAddModeChange = null,
  onSaveRequest = null,
  onCollectionCreated = null
}) {
  // Handle modal close - reset edit/add mode
  const handleClose = () => {
    onClose();
  };

  if (!item) return null;

  return (
    <div className="item-detail-overlay" onClick={handleClose} role="dialog" aria-modal="true" aria-labelledby="item-detail-title">
      <div className={`item-detail-modal ${isSuggestionPreview ? 'suggestion-preview' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="detail-close-btn" onClick={handleClose} aria-label="Close item details">
          <svg viewBox="0 0 24 24" fill="none" width="24" height="24" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <ItemDetailContent
          item={item}
          index={index}
          isOwned={isOwned}
          onToggleOwnership={onToggleOwnership}
          onClose={onClose}
          onNavigateToCollection={onNavigateToCollection}
          collection={collection}
          isSuggestionPreview={isSuggestionPreview}
          onAcceptSuggestion={onAcceptSuggestion}
          onRejectSuggestion={onRejectSuggestion}
          isUserItem={isUserItem}
          showAsWishlist={showAsWishlist}
          currentCollection={currentCollection}
          externalEditMode={externalEditMode}
          onEditModeChange={onEditModeChange}
          externalAddMode={externalAddMode}
          onAddModeChange={onAddModeChange}
          onSaveRequest={onSaveRequest}
          onCollectionCreated={onCollectionCreated}
        />
      </div>
    </div>
  );
}

export default ItemDetail;
