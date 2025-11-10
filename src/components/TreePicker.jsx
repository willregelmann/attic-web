import { useState, useMemo } from 'react';
import { Folder, ChevronRight, ChevronDown } from 'lucide-react';
import './TreePicker.css';

/**
 * TreePicker - Hierarchical collection selector component
 *
 * @param {Object} props
 * @param {Array} props.collections - Flat array of collection objects with parent_collection_id
 * @param {Function} props.onSelect - Callback when user selects a collection: (collectionId) => void
 * @param {Boolean} props.allowRoot - Show "Root (uncategorized)" option
 * @param {Boolean} props.allowCreate - Show "Create new collection" option
 * @param {String} props.selectedId - Currently selected collection ID (for highlighting)
 * @param {Boolean} props.loading - Whether collections are loading
 * @param {Object} props.error - Error object if loading failed
 * @param {Function} props.onRetry - Callback to retry loading collections
 */
function TreePicker({
  collections = [],
  onSelect,
  allowRoot = false,
  allowCreate = false,
  selectedId = null,
  loading = false,
  error = null,
  onRetry
}) {
  // Track which collection folders are expanded
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Build hierarchical tree structure from flat array
  const treeData = useMemo(() => buildTree(collections), [collections]);

  // Toggle expand/collapse state for a collection
  const toggleExpand = (collectionId) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  // Handle selection
  const handleSelect = (collectionId) => {
    if (onSelect) {
      onSelect(collectionId);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="tree-picker tree-picker-loading">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading collections...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="tree-picker tree-picker-error">
        <div className="error-indicator">
          <svg viewBox="0 0 24 24" fill="none" width="48" height="48" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
          </svg>
          <p>Failed to load collections</p>
          {onRetry && (
            <button className="retry-button" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Empty state (no collections available)
  const hasContent = collections.length > 0 || allowRoot || allowCreate;
  if (!hasContent) {
    return (
      <div className="tree-picker tree-picker-empty">
        <div className="empty-indicator">
          <svg viewBox="0 0 24 24" fill="none" width="48" height="48" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7l9-4 9 4M3 7h18"/>
          </svg>
          <p>No collections yet</p>
          {allowCreate && <p className="empty-hint">Create your first collection!</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="tree-picker">
      {/* Optional root selection */}
      {allowRoot && (
        <div
          className={`tree-item root-item ${selectedId === null ? 'selected' : ''}`}
          style={{ paddingLeft: '0.5rem' }}
        >
          <div className="tree-item-content">
            <Folder className="tree-icon" size={16} />
            <span className="tree-label">Root (uncategorized)</span>
          </div>
          <button
            className="select-button"
            onClick={() => handleSelect(null)}
            aria-label="Select root collection"
          >
            Select
          </button>
        </div>
      )}

      {/* Render tree recursively */}
      {treeData.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          expandedIds={expandedIds}
          selectedId={selectedId}
          onToggle={toggleExpand}
          onSelect={handleSelect}
        />
      ))}

      {/* Optional create new collection */}
      {allowCreate && (
        <div
          className="tree-item create-item"
          style={{ paddingLeft: '0.5rem' }}
        >
          <div className="tree-item-content">
            <span className="create-icon">+</span>
            <span className="tree-label">Create new collection</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * TreeNode - Recursive component for rendering a tree node and its children
 */
function TreeNode({
  node,
  level,
  expandedIds,
  selectedId,
  onToggle,
  onSelect
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;

  // Calculate indentation (20px per level)
  const paddingLeft = `${level * 20 + 8}px`;

  return (
    <>
      <div
        className={`tree-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft }}
      >
        <div className="tree-item-content">
          {/* Expand/collapse toggle for collections with children */}
          {hasChildren ? (
            <button
              className="tree-toggle"
              onClick={() => onToggle(node.id)}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          ) : (
            <span className="tree-spacer" />
          )}

          {/* Folder icon */}
          <Folder className="tree-icon" size={16} />

          {/* Collection name */}
          <span
            className="tree-label"
            onClick={hasChildren ? () => onToggle(node.id) : undefined}
            style={{ cursor: hasChildren ? 'pointer' : 'default' }}
          >
            {node.name}
          </span>
        </div>

        {/* Select button */}
        <button
          className="select-button"
          onClick={() => onSelect(node.id)}
          aria-label={`Select ${node.name}`}
        >
          Select
        </button>
      </div>

      {/* Render children if expanded */}
      {hasChildren && isExpanded && (
        <div className="tree-children">
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedIds={expandedIds}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Build hierarchical tree from flat array of collections
 * @param {Array} collections - Flat array with parent_collection_id references
 * @returns {Array} Root-level nodes with nested children
 */
function buildTree(collections) {
  if (!collections || collections.length === 0) {
    return [];
  }

  // Create map of all collections with empty children arrays
  const collectionsMap = new Map();
  collections.forEach(col => {
    collectionsMap.set(col.id, { ...col, children: [] });
  });

  // Track roots
  const roots = [];

  // Build hierarchy by assigning children to parents
  collections.forEach(col => {
    const node = collectionsMap.get(col.id);

    if (col.parent_collection_id) {
      // This is a child - add to parent's children array
      const parent = collectionsMap.get(col.parent_collection_id);
      if (parent) {
        parent.children.push(node);
      } else {
        // Parent doesn't exist - treat as root
        roots.push(node);
      }
    } else {
      // This is a root node
      roots.push(node);
    }
  });

  // Sort roots and children alphabetically by name
  const sortByName = (a, b) => a.name.localeCompare(b.name);
  roots.sort(sortByName);

  // Recursively sort children
  const sortChildren = (node) => {
    if (node.children && node.children.length > 0) {
      node.children.sort(sortByName);
      node.children.forEach(sortChildren);
    }
  };
  roots.forEach(sortChildren);

  return roots;
}

export default TreePicker;
