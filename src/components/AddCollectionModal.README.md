# AddCollectionModal Component

A modal component for adding entire DBoT (Database of Things) collections to a user's wishlist.

## Overview

This component provides two modes for adding collections:

1. **Track Mode** - Creates a new linked collection that tracks official completion progress with dual progress bars (owned vs wishlist items)
2. **Add to Existing Mode** - Adds all items from the DBoT collection to an existing custom collection

## Component API

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | Boolean | Yes | Controls modal visibility |
| `onClose` | Function | Yes | Callback to close modal |
| `dbotCollection` | Object | Yes | DBoT collection to add `{ id, name, ... }` |
| `onSuccess` | Function | No | Callback after successful addition, receives result object |

### DBoT Collection Object

```javascript
{
  id: 'dbot_123',           // Required
  name: 'Pokemon Base Set', // Required
  type: 'trading_card_set', // Optional
  year: 1999,               // Optional
  image_url: 'https://...'  // Optional
}
```

### Success Callback Result

```javascript
{
  collection_id: 'collection_456',  // ID of created/updated collection
  items_added: 102,                 // Number of items added
  items_already_owned: 15,          // Number of items already in collection
  message: 'Success message'        // Human-readable success message
}
```

## Usage Example

```javascript
import { useState } from 'react';
import AddCollectionModal from './components/AddCollectionModal';

function CollectionView() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dbotCollection = {
    id: 'dbot_123',
    name: 'Pokemon Base Set',
    year: 1999
  };

  const handleSuccess = (result) => {
    console.log(`Added ${result.items_added} items!`);
    // Show toast notification, refetch data, etc.
  };

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Add to Wishlist
      </button>

      <AddCollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dbotCollection={dbotCollection}
        onSuccess={handleSuccess}
      />
    </>
  );
}
```

## Features

### Two Operation Modes

#### Track Mode (Default)
- Creates a new linked collection
- Collection name is required (defaults to DBoT collection name)
- Optional parent collection selection via TreePicker
- Tracks official completion with dual progress bars
- Best for: Following official collections (sets, series, etc.)

#### Add to Existing Mode
- Adds all items to an existing custom collection
- Target collection selection is required via TreePicker
- Items are added as wishlist items
- Best for: Custom organization (e.g., "Want to Buy", "Childhood Favorites")

### Form Validation

- **Track Mode**: Requires non-empty collection name
- **Add to Existing Mode**: Requires target collection selection
- Submit button disabled until validation passes
- Real-time validation feedback

### TreePicker Integration

- Hierarchical collection selection
- Expandable/collapsible folders
- "Root (uncategorized)" option available
- Scrollable with max-height: 300px (250px on mobile)
- Visual selection highlighting

### Loading States

- Spinner animation during mutation
- Button text changes ("Adding...", "Track Collection", "Add Items")
- All buttons disabled during loading
- Prevents double submissions

### Error Handling

- GraphQL errors displayed in red error box
- User-friendly error messages
- Error icon for visual clarity
- Errors clear when retrying or changing modes

### Accessibility

- Escape key closes modal
- Click outside overlay closes modal
- Proper ARIA labels (`aria-label`, `aria-expanded`)
- Keyboard navigation support
- Autofocus on collection name input (Track mode)
- Semantic HTML (label, input associations)

### Mobile Responsiveness

| Breakpoint | Adjustments |
|------------|-------------|
| Mobile (<768px) | - Modal width: 95%<br>- Stacked footer buttons<br>- Reduced padding<br>- TreePicker max-height: 250px<br>- Smaller font sizes |
| Tablet (769-1024px) | - Modal max-width: 600px |
| Desktop (>1024px) | - Modal max-width: 700px |

## GraphQL Integration

### Query: MY_COLLECTION_TREE

Fetches user's collection hierarchy for TreePicker:

```graphql
query MyCollectionTree($parentId: ID) {
  myCollectionTree(parent_id: $parentId) {
    collections {
      id
      name
      description
      progress {
        owned_count
        wishlist_count
        total_count
        percentage
      }
    }
  }
}
```

### Mutation: ADD_COLLECTION_TO_WISHLIST

Adds DBoT collection to user's wishlist:

```graphql
mutation AddCollectionToWishlist(
  $dbot_collection_id: ID!
  $mode: String!
  $new_collection_name: String
  $target_collection_id: ID
) {
  addCollectionToWishlist(
    dbot_collection_id: $dbot_collection_id
    mode: $mode
    new_collection_name: $new_collection_name
    target_collection_id: $target_collection_id
  ) {
    collection_id
    items_added
    items_already_owned
    message
  }
}
```

### Variables by Mode

**Track Mode:**
```javascript
{
  dbot_collection_id: "dbot_123",
  mode: "TRACK",
  new_collection_name: "My Pokemon Base Set",
  target_collection_id: null  // Optional parent
}
```

**Add to Existing Mode:**
```javascript
{
  dbot_collection_id: "dbot_123",
  mode: "ADD_TO_EXISTING",
  target_collection_id: "collection_456"  // Required
}
```

### Refetch Behavior

After successful mutation, the component automatically refetches:
- `MY_COLLECTION_TREE` - To show newly created/updated collections

## Styling

### CSS Architecture

- Component-specific styles in `AddCollectionModal.css`
- Uses CSS custom properties from global theme:
  - `--white`
  - `--navy-blue`
  - `--text-primary`
  - `--text-secondary`
- BEM-like class naming for clarity
- Responsive breakpoints at 768px and 1024px

### Key Classes

| Class | Purpose |
|-------|---------|
| `.modal-overlay` | Full-screen backdrop with fade-in animation |
| `.add-collection-modal` | Modal container with slide-up animation |
| `.mode-option` | Radio button option for mode selection |
| `.tree-picker-container` | Scrollable container for TreePicker |
| `.text-input` | Text input with focus states |
| `.btn-confirm` / `.btn-cancel` | Action buttons with hover/disabled states |
| `.error-message` | Error display with icon |

### Animations

- **fadeIn**: Overlay fade-in (0.2s)
- **slideUp**: Modal slide-up entrance (0.3s)
- **spin**: Loading spinner rotation (0.6s)

### Color Scheme

- Primary action: `var(--navy-blue)` (#4A90E2)
- Success (unused): `#10b981`
- Error: `#dc2626` on `#fef2f2` background
- Borders: `#e9ecef`, `#dee2e6`
- Backgrounds: `#f8f9fa` (light gray)

## Component Dependencies

```javascript
import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { ADD_COLLECTION_TO_WISHLIST, MY_COLLECTION_TREE } from '../queries';
import TreePicker from './TreePicker';
import './AddCollectionModal.css';
```

### Internal Dependencies

- **TreePicker** (Task 9) - Hierarchical collection selector
- **queries.js** - GraphQL operations
- **AddCollectionModal.css** - Component styles

### External Dependencies

- `@apollo/client` - GraphQL client
- `react` - Core React library

## State Management

### Local State

```javascript
const [mode, setMode] = useState('track');                    // 'track' | 'add_to_existing'
const [collectionName, setCollectionName] = useState('');     // Text input value
const [selectedCollectionId, setSelectedCollectionId] = useState(null);  // TreePicker selection
const [loading, setLoading] = useState(false);                // Mutation loading state
const [error, setError] = useState(null);                     // Error message
```

### GraphQL State

- **collectionsData** - User's collection tree from `MY_COLLECTION_TREE` query
- **addCollectionToWishlist** - Mutation function from `ADD_COLLECTION_TO_WISHLIST`

### Reset Behavior

State is reset when modal opens:
- `mode` → 'track'
- `collectionName` → DBoT collection name
- `selectedCollectionId` → null
- `error` → null
- `loading` → false

## Testing Checklist

### Functional Testing

- [ ] Modal opens and closes correctly
- [ ] Radio buttons switch modes smoothly
- [ ] Collection name input accepts text (Track mode)
- [ ] TreePicker selects collections (both modes)
- [ ] Root selection works in TreePicker
- [ ] Submit button disabled when invalid
- [ ] Submit button enabled when valid
- [ ] Loading spinner shows during mutation
- [ ] Success callback fires with correct data
- [ ] Modal closes after success
- [ ] Error messages display correctly
- [ ] Escape key closes modal
- [ ] Click outside closes modal

### Mode-Specific Testing

**Track Mode:**
- [ ] Collection name required
- [ ] Parent collection optional
- [ ] Default name is DBoT collection name
- [ ] Creates linked collection on submit

**Add to Existing Mode:**
- [ ] Target collection required
- [ ] Can select any collection
- [ ] Adds items to selected collection

### Responsive Testing

- [ ] Mobile: Buttons stack vertically
- [ ] Mobile: Modal width 95%
- [ ] Mobile: TreePicker height reduced
- [ ] Tablet: Modal max-width 600px
- [ ] Desktop: Modal max-width 700px
- [ ] All screen sizes: Content scrollable

### Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Escape key closes modal
- [ ] Screen reader announces labels
- [ ] Focus management correct
- [ ] ARIA labels present
- [ ] Form validation clear

## Known Limitations

1. **No Keyboard Navigation for Radio Buttons**: Radio buttons are styled labels, keyboard users may need tab navigation
2. **No Undo**: Once submitted, items are added immediately with no undo option
3. **No Progress Indicator**: Large collections may take time to add, no granular progress shown
4. **No Preview**: Users can't preview which items will be added before confirming
5. **Single Collection**: Can only add one collection at a time

## Future Enhancements

1. **Preview Mode**: Show list of items to be added before confirming
2. **Bulk Operations**: Add multiple collections at once
3. **Conflict Resolution**: Handle duplicate items more gracefully
4. **Progress Bar**: Show progress for large collections
5. **Undo Action**: Allow users to undo recent additions
6. **Collection Stats**: Show collection size/completeness before adding
7. **Smart Suggestions**: Suggest parent collections based on DBoT collection metadata

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox required
- CSS Custom Properties required
- ES6+ JavaScript features required

## Performance Considerations

- TreePicker renders full hierarchy (potential issue with 1000+ collections)
- GraphQL query fetches all collections (consider pagination for large datasets)
- Modal animations use CSS (GPU-accelerated)
- No virtualization for long lists

## Files

```
src/components/
├── AddCollectionModal.jsx           # Main component
├── AddCollectionModal.css           # Component styles
├── AddCollectionModal.README.md     # This documentation
└── AddCollectionModal.example.jsx   # Usage examples
```

## Version History

- **v1.0** (2025-11-09) - Initial implementation
  - Track mode with linked collections
  - Add to existing mode
  - TreePicker integration
  - Mobile responsive design
  - Complete accessibility support
