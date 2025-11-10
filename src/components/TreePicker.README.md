# TreePicker Component

A hierarchical tree-based collection picker component for selecting collections from a nested structure.

## Overview

TreePicker displays user collections in a collapsible tree view with visual indentation, expand/collapse controls, and selection functionality. Perfect for displaying and selecting from hierarchical collection data.

## Features

- **Hierarchical Display**: Automatically builds tree structure from flat array with parent references
- **Expand/Collapse**: Click arrows or folder names to expand/collapse nested collections
- **Visual Hierarchy**: 20px indentation per level with folder icons
- **Selection**: "Select" button appears on hover, highlights selected collection
- **Optional Elements**:
  - "Root (uncategorized)" option for top-level items
  - "Create new collection" action at bottom
- **Responsive**: Mobile-friendly with touch-optimized controls
- **Accessible**: ARIA labels, keyboard navigation, focus states
- **Smooth Animations**: Expand/collapse with slide-down effect
- **Alphabetical Sorting**: Collections sorted by name at each level

## Installation

```javascript
import TreePicker from './components/TreePicker';
import './components/TreePicker.css';
```

## Basic Usage

```javascript
import { useState } from 'react';
import TreePicker from './components/TreePicker';

function MyComponent() {
  const [selectedId, setSelectedId] = useState(null);

  const collections = [
    { id: '1', name: 'Pokemon Cards', parent_collection_id: null },
    { id: '2', name: 'Base Set', parent_collection_id: '1' },
    { id: '3', name: 'Jungle Set', parent_collection_id: '1' },
    { id: '4', name: 'Magic: The Gathering', parent_collection_id: null },
  ];

  return (
    <TreePicker
      collections={collections}
      onSelect={setSelectedId}
      allowRoot={false}
      allowCreate={false}
      selectedId={selectedId}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `collections` | `Array` | `[]` | Flat array of collection objects with `parent_collection_id` |
| `onSelect` | `Function` | - | Callback when user selects: `(collectionId) => void` |
| `allowRoot` | `Boolean` | `false` | Show "Root (uncategorized)" option at top |
| `allowCreate` | `Boolean` | `false` | Show "+ Create new collection" option at bottom |
| `selectedId` | `String` | `null` | Currently selected collection ID (for highlighting) |

### Collection Object Structure

Each collection object must have:

```javascript
{
  id: String,                    // Unique identifier
  name: String,                  // Display name
  parent_collection_id: String | null  // Parent ID (null = root level)
}
```

## Advanced Examples

### With Root and Create Options

```javascript
<TreePicker
  collections={collections}
  onSelect={(id) => {
    if (id === null) {
      console.log('Root selected');
    } else {
      console.log('Collection selected:', id);
    }
  }}
  allowRoot={true}
  allowCreate={true}
  selectedId={selectedId}
/>
```

### In a Modal Dialog

```javascript
function AddToCollectionModal({ onClose, onSave }) {
  const [selectedId, setSelectedId] = useState(null);
  const { data } = useQuery(GET_USER_COLLECTIONS);

  return (
    <div className="modal">
      <h2>Select Collection</h2>
      <TreePicker
        collections={data?.userCollections || []}
        onSelect={setSelectedId}
        allowRoot={true}
        allowCreate={false}
        selectedId={selectedId}
      />
      <div className="modal-actions">
        <button onClick={onClose}>Cancel</button>
        <button
          onClick={() => onSave(selectedId)}
          disabled={selectedId === null}
        >
          Save
        </button>
      </div>
    </div>
  );
}
```

### Deep Nesting Example

```javascript
const deepCollections = [
  { id: '1', name: 'Sports', parent_collection_id: null },
  { id: '2', name: 'Baseball', parent_collection_id: '1' },
  { id: '3', name: 'MLB', parent_collection_id: '2' },
  { id: '4', name: 'Yankees', parent_collection_id: '3' },
  { id: '5', name: '2023 Season', parent_collection_id: '4' },
];

// Renders as:
// 📁 Sports
//   📁 Baseball
//     📁 MLB
//       📁 Yankees
//         📁 2023 Season
```

## Component Behavior

### Tree Building Algorithm

The component uses a two-pass algorithm to build the tree:

1. **First Pass**: Create a Map of all collections with empty children arrays
2. **Second Pass**: Iterate through collections and assign each to parent's children array or roots array
3. **Sorting**: Alphabetically sort all levels recursively

### Expand/Collapse State

- Default: All folders collapsed
- State tracked in `Set` for efficient lookup
- Toggle function adds/removes from Set
- Children only render when parent is expanded

### Selection Behavior

- Click "Select" button to choose a collection
- Selected item highlighted with blue left border and background tint
- Only one selection at a time
- `onSelect` callback receives collection ID (or `null` for root)

### Root Option

When `allowRoot={true}`:
- Shows "📁 Root (uncategorized)" at top
- Clicking "Select" passes `null` to `onSelect` callback
- Useful for "no collection" or "top level" option

### Create Option

When `allowCreate={true}`:
- Shows "+ Create new collection" at bottom
- Separated by border from tree
- Currently display-only (wire up click handler in parent component)

## Styling

### CSS Variables Used

The component uses theme variables from `index.css`:

```css
--bg-primary          /* Container background */
--bg-secondary        /* Hover background */
--bg-tertiary         /* Darker hover states */
--border-color        /* Borders and dividers */
--text-primary        /* Main text color */
--text-secondary      /* Muted text (icons, labels) */
--bright-blue         /* Primary actions (select button, icons) */
--navy-blue           /* Hover states for buttons */
```

### Customization

Override styles by targeting classes:

```css
/* Make tree wider */
.tree-picker {
  max-height: 600px;
}

/* Change indentation */
.tree-item {
  /* Adjust padding-left calculation in component */
}

/* Custom select button */
.select-button {
  background: #custom-color;
}
```

### Dark Mode

Fully supports dark mode via CSS variables. No component changes needed.

## Accessibility

### Keyboard Navigation

- **Tab**: Focus select buttons and toggle buttons
- **Enter/Space**: Activate focused button
- **Arrow Keys**: Native scroll behavior

### ARIA Attributes

- `aria-label` on all interactive buttons
- `aria-expanded` on toggle buttons (true/false)
- Focus indicators with `outline` on `:focus-visible`

### Screen Readers

- Folder icons use Lucide React with proper SVG semantics
- Button labels clearly identify action ("Select [Name]", "Expand", "Collapse")
- Tree structure conveyed through nesting

### High Contrast Mode

```css
@media (prefers-contrast: high) {
  .tree-item.selected {
    border-left-width: 4px;
  }
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  /* Disables all transitions and animations */
}
```

## Performance

### Optimizations

1. **useMemo**: Tree building only runs when `collections` array changes
2. **Efficient State**: `Set` for O(1) expand/collapse lookups
3. **Conditional Rendering**: Children only render when expanded
4. **CSS Animations**: Hardware-accelerated transforms

### Large Trees

For 100+ collections:
- Tree building is O(n) with two passes
- Expand/collapse is O(1) lookup
- Rendering is O(visible nodes) not O(total nodes)

## Testing

### Manual Testing

1. **Visual Test Page**: Use `TreePicker.test.jsx`
   - Shows all feature combinations
   - Live selection display
   - Multiple test cases

2. **Run Test Page**:
   ```javascript
   // Add route to App.jsx (development only)
   import TreePickerTest from './components/TreePicker.test';

   <Route path="/test-tree-picker" element={<TreePickerTest />} />
   ```

### Test Cases

1. **Empty Collections**: Shows empty state
2. **Flat List**: All root level, no nesting
3. **Deep Nesting**: 4+ levels of hierarchy
4. **Root Option**: Selectable "Root" item
5. **Create Option**: Bottom action item
6. **Selection Persistence**: Highlight survives expand/collapse

## Common Patterns

### Loading State

```javascript
function CollectionPickerWithLoading() {
  const { loading, data } = useQuery(GET_COLLECTIONS);

  if (loading) {
    return <div>Loading collections...</div>;
  }

  return (
    <TreePicker
      collections={data.collections}
      onSelect={handleSelect}
    />
  );
}
```

### Error Handling

```javascript
function CollectionPickerWithError() {
  const { error, data } = useQuery(GET_COLLECTIONS);

  if (error) {
    return <div>Error loading collections: {error.message}</div>;
  }

  return (
    <TreePicker
      collections={data?.collections || []}
      onSelect={handleSelect}
    />
  );
}
```

### Pre-selecting

```javascript
// Pre-select a collection (e.g., current parent)
const [selectedId, setSelectedId] = useState(currentParentId);

<TreePicker
  collections={collections}
  onSelect={setSelectedId}
  selectedId={selectedId}
/>
```

### Filtering Collections

```javascript
// Filter out specific collections (e.g., can't move to self)
const filteredCollections = collections.filter(c => c.id !== currentId);

<TreePicker
  collections={filteredCollections}
  onSelect={handleSelect}
/>
```

## Integration with AddCollectionModal (Task 10)

The TreePicker is designed to work seamlessly with AddCollectionModal:

```javascript
function AddCollectionModal({ wishlistItem, onClose, onSave }) {
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const { data } = useQuery(GET_USER_COLLECTIONS);

  return (
    <div className="modal">
      <h2>Add "{wishlistItem.name}" to Collection</h2>

      <TreePicker
        collections={data?.userCollections || []}
        onSelect={setSelectedCollectionId}
        allowRoot={true}
        allowCreate={false}
        selectedId={selectedCollectionId}
      />

      <div className="modal-footer">
        <button onClick={onClose}>Cancel</button>
        <button
          onClick={() => onSave(selectedCollectionId)}
          disabled={selectedCollectionId === null}
        >
          Add to Collection
        </button>
      </div>
    </div>
  );
}
```

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (last 2 versions)
- **CSS Features**: CSS Grid, CSS Variables, Flexbox
- **JavaScript**: ES6+ (Arrow functions, template literals, Set, Map)
- **Icons**: Lucide React (SVG-based, works everywhere)

## Troubleshooting

### Collections Not Showing

- Check `collections` array has valid data
- Verify each object has `id`, `name`, `parent_collection_id`
- Check console for errors

### Tree Structure Wrong

- Verify `parent_collection_id` references valid parent `id`
- Orphaned children (invalid parent) appear at root level
- Use browser DevTools to inspect tree structure

### Selection Not Working

- Ensure `onSelect` prop is provided
- Check `selectedId` prop is being updated
- Verify callback receives correct ID

### Styling Issues

- Import CSS file: `import './TreePicker.css'`
- Check CSS variable definitions in `index.css`
- Use browser DevTools to inspect computed styles

## Future Enhancements

Potential improvements for future versions:

1. **Search/Filter**: Search box to filter visible collections
2. **Drag & Drop**: Reorder or move collections via drag
3. **Bulk Selection**: Multi-select with checkboxes
4. **Context Menu**: Right-click actions (edit, delete, etc.)
5. **Virtual Scrolling**: For extremely large trees (1000+ items)
6. **Expand All/Collapse All**: Buttons for bulk expand/collapse
7. **Persist Expanded State**: Remember which folders were open

## License

Part of Will's Attic project. See main project README for license information.
