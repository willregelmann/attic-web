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
    <li className="m-0 p-0 block">
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-2 py-1 border-none text-left cursor-pointer transition-opacity duration-200 hover:opacity-70 ${isSelected ? 'font-semibold bg-[var(--bg-tertiary)] rounded-md' : 'font-normal bg-transparent'}`}
        style={{
          paddingLeft: `${12 + (depth * 20)}px`
        }}
        title={`Select ${collection.name}`}
      >
        {depth > 0 && (
          <svg className="flex-shrink-0 text-[var(--text-secondary)] mr-[-4px] opacity-60" viewBox="0 0 16 16" width="16" height="16">
            <path d="M8 0 L8 8 L16 8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        )}
        <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">{collection.name}</span>
        {subLoading ? (
          <span className="flex-shrink-0 text-[var(--text-secondary)] text-sm w-5 inline-flex items-center justify-center">⋯</span>
        ) : hasSubcollections ? (
          <span className="flex-shrink-0 text-[var(--text-secondary)] text-sm w-5 inline-flex items-center justify-center">
            {isExpanded ? '−' : '+'}
          </span>
        ) : null}
      </button>

      {isExpanded && hasSubcollections && (
        <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
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
    <div className="flex flex-col">
      <div className="m-0 flex flex-col">
        {collectionsLoading ? (
          <CollectionTreeSkeleton count={2} />
        ) : (
          <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
            {/* Root collection option - expandable */}
            <li className="m-0 p-0 block">
              <button
                onClick={handleRootClick}
                className={`w-full flex items-center gap-2 py-1 pl-3 border-none text-left cursor-pointer transition-opacity duration-200 hover:opacity-70 ${selectedId === null ? 'font-semibold bg-[var(--bg-tertiary)] rounded-md' : 'font-normal bg-transparent'}`}
                title="Select My Collection (root)"
              >
                <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">My Collection</span>
              </button>

              {/* User collections tree - nested under root */}
              {isRootExpanded && (
                <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
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
