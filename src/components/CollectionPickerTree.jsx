import { useState, useEffect, memo } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client/react';
import { MY_COLLECTION_TREE } from '../queries';
import { CollectionTreeSkeleton } from './SkeletonLoader';

// Collection picker node - expandable tree for selecting collection
const CollectionPickerNode = memo(({ collection, depth = 0, selectedId, onSelect, expandedIds = new Set(), excludeCollectionId = null }) => {
  // Don't render this node if it's the excluded collection (MUST be before hooks)
  if (excludeCollectionId && collection.id === excludeCollectionId) {
    return null;
  }

  const [isExpanded, setIsExpanded] = useState(false);
  const [hasManuallyInteracted, setHasManuallyInteracted] = useState(false);
  const [fetchSubcollections, { data: subData, loading: subLoading }] = useLazyQuery(MY_COLLECTION_TREE, {
    fetchPolicy: 'cache-first'
  });

  const subcollections = subData?.myCollectionTree?.collections || [];
  const hasSubcollections = subcollections.length > 0;
  const isSelected = selectedId === collection.id;

  // Auto-expand when this collection is in the expandedIds set (but only if not manually interacted)
  useEffect(() => {
    if (!hasManuallyInteracted && expandedIds.has(collection.id) && !isExpanded) {
      setIsExpanded(true);
      if (!subData) {
        fetchSubcollections({ variables: { parentId: collection.id } });
      }
    }
  }, [expandedIds, collection.id, isExpanded, subData, fetchSubcollections, hasManuallyInteracted]);

  const handleClick = () => {
    // Mark that user has manually interacted with this node
    setHasManuallyInteracted(true);

    // Always select this collection
    onSelect(collection.id);

    // Toggle expansion
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    // Fetch subcollections if expanding and not yet fetched
    if (newExpanded && !subData) {
      fetchSubcollections({ variables: { parentId: collection.id } });
    }
  };

  return (
    <li className="tree-item">
      <button
        onClick={handleClick}
        className={`tree-collection-link ${isSelected ? 'selected' : ''}`}
        style={{
          paddingLeft: `${12 + (depth * 20)}px`,
          fontWeight: isSelected ? '600' : '400',
          backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'transparent',
          borderRadius: isSelected ? '6px' : '0'
        }}
        title={`Select ${collection.name}`}
      >
        {depth > 0 && (
          <svg className="tree-branch" viewBox="0 0 16 16" width="16" height="16">
            <path d="M8 0 L8 8 L16 8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        )}
        <span className="tree-collection-name">{collection.name}</span>
        {subLoading ? (
          <span className="tree-expand-indicator">⋯</span>
        ) : hasSubcollections ? (
          <span className="tree-expand-indicator">
            {isExpanded ? '−' : '+'}
          </span>
        ) : null}
      </button>

      {isExpanded && hasSubcollections && (
        <ul className="tree-nested-list">
          {subcollections.map((sub) => (
            <CollectionPickerNode
              key={sub.id}
              collection={sub}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              excludeCollectionId={excludeCollectionId}
            />
          ))}
        </ul>
      )}
    </li>
  );
});

/**
 * CollectionPickerTree - Reusable collection picker tree component
 *
 * @param {String} selectedId - Currently selected collection ID
 * @param {Function} onSelect - Callback when a collection is selected: (collectionId) => void
 * @param {Set} expandedIds - Set of collection IDs that should be auto-expanded
 * @param {String} excludeCollectionId - Collection ID to exclude from the tree (optional)
 * @param {Boolean} isAuthenticated - Whether user is authenticated
 */
export function CollectionPickerTree({
  selectedId,
  onSelect,
  expandedIds = new Set(),
  excludeCollectionId = null,
  isAuthenticated = true
}) {
  const [isRootExpanded, setIsRootExpanded] = useState(true);

  // Fetch user's collections for tree
  const { data: collectionsData, loading: collectionsLoading } = useQuery(MY_COLLECTION_TREE, {
    variables: { parentId: null },
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network'
  });

  const handleRootClick = () => {
    if (selectedId === null) {
      // Already selected, just toggle collapse
      setIsRootExpanded(!isRootExpanded);
    } else {
      // Not selected, select and expand
      onSelect(null);
      setIsRootExpanded(true);
    }
  };

  return (
    <div className="detail-collections-tree">
      <div className="collections-tree-list">
        {collectionsLoading ? (
          <CollectionTreeSkeleton count={2} />
        ) : (
          <ul className="tree-list">
            {/* Root collection option - expandable */}
            <li className="tree-item">
              <button
                onClick={handleRootClick}
                className={`tree-collection-link ${selectedId === null ? 'selected' : ''}`}
                style={{
                  paddingLeft: '12px',
                  fontWeight: selectedId === null ? '600' : '400',
                  backgroundColor: selectedId === null ? 'var(--bg-tertiary)' : 'transparent',
                  borderRadius: selectedId === null ? '6px' : '0'
                }}
                title="Select My Collection (root)"
              >
                <span className="tree-collection-name">My Collection</span>
              </button>

              {/* User collections tree - nested under root */}
              {isRootExpanded && (
                <ul className="tree-nested-list">
                  {collectionsData?.myCollectionTree?.collections?.map((collection) => (
                    <CollectionPickerNode
                      key={collection.id}
                      collection={collection}
                      depth={1}
                      selectedId={selectedId}
                      onSelect={onSelect}
                      expandedIds={expandedIds}
                      excludeCollectionId={excludeCollectionId}
                    />
                  ))}
                </ul>
              )}
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
