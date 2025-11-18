import { useState } from 'react';
import { Modal } from './Modal';
import EntityDetail from './EntityDetail';

function EntityDetailModal({
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
  externalWishlistMode = false,
  onWishlistModeChange = null,
  onCollectionWishlisted = null,
  onSaveRequest = null,
  onCollectionCreated = null,
  onDeleteCollection = null,
  onDeleteItem = null,
  onItemAdded = null
}) {
  const [isSaving, setIsSaving] = useState(false);

  if (!item) return null;

  return (
    <Modal
      isOpen={!!item}
      onClose={isSaving ? undefined : onClose}
      size="4xl"
      showCloseButton={true}
      closeOnOverlayClick={!isSaving}
      closeOnEscape={!isSaving}
    >
      <div className={`${isSuggestionPreview ? 'border-2 border-blue-500 rounded-lg' : ''} ${isSaving ? 'opacity-70 pointer-events-none' : ''}`}>
        <EntityDetail
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
          externalWishlistMode={externalWishlistMode}
          onWishlistModeChange={onWishlistModeChange}
          onCollectionWishlisted={onCollectionWishlisted}
          onSaveRequest={onSaveRequest}
          onCollectionCreated={onCollectionCreated}
          onDeleteCollection={onDeleteCollection}
          onDeleteItem={onDeleteItem}
          onItemAdded={onItemAdded}
          onSavingChange={setIsSaving}
        />
      </div>
    </Modal>
  );
}

export default EntityDetailModal;
