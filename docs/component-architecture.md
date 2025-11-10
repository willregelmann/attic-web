# Frontend Component Architecture

## Collection Display Components

### Overview

We use a composition-based architecture for displaying collections and items, with shared UI components to maintain consistency and reduce duplication.

### Component Hierarchy

```
ItemList (DBoT collections)
├── CollectionHeader (shared)
│   ├── Collection image
│   ├── Title + subtitle
│   ├── Progress bar
│   └── Action buttons (Filter + Wishlist)
└── ItemGrid (shared)
    ├── ItemCard (owned items)
    └── CollectionCard (subcollections)

MyCollection (User collections)
├── CollectionHeader (shared)
│   ├── Collection image or folder icon
│   ├── Title + subtitle
│   ├── Progress bar
│   └── Action buttons (Create Collection + Add Item)
└── ItemGrid (shared)
    ├── CollectionCard (custom subcollections)
    ├── ItemCard (owned items - full opacity)
    └── ItemCard (wishlist items - 60% opacity)
```

### Shared Components

#### CollectionHeader (`components/CollectionHeader.jsx`)

Reusable collection header with image, title, actions, and progress bar.

**Props:**
- `collection`: Collection data (name, type, year, image_url, thumbnail_url)
- `subtitle`: Subtitle text
- `ownedCount`: Number of owned items
- `totalCount`: Total number of items
- `actions`: React node for action buttons
- `onClick`: Optional click handler
- `clickable`: Boolean for clickable styling
- `showProgress`: Boolean to show/hide progress bar

**Usage:**
```jsx
<CollectionHeader
  collection={collection}
  subtitle="Collection • 2024"
  ownedCount={5}
  totalCount={10}
  actions={<button>Filter</button>}
  onClick={handleClick}
  clickable={true}
/>
```

#### ItemGrid (`components/ItemGrid.jsx`)

Reusable grid wrapper for rendering items and collections consistently.

**Props:**
- `items`: Array of items/collections to render
- `onItemClick`: Function(item, index) for item clicks
- `onCollectionClick`: Function(collection) for collection clicks
- `userOwnership`: Set of owned item IDs
- `userFavorites`: Set of favorited collection IDs
- `isRoot`: Boolean for root view styling
- `viewMode`: 'grid' or 'list'

**Usage:**
```jsx
<ItemGrid
  items={filteredItems}
  onItemClick={(item, idx) => openDetail(item)}
  onCollectionClick={navigateToCollection}
  userOwnership={ownedIds}
  viewMode="grid"
/>
```

#### ItemCard (`components/ItemCard.jsx`)

Individual item card with image, title, metadata, and ownership styling.

**Props:**
- `item`: Item data
- `index`: Index for gradient variation
- `onClick`: Click handler
- `isOwned`: Boolean (full opacity if true)
- `isFavorite`: Boolean (yellow border if true)

**Styling:**
- Owned items: Full opacity
- Wishlist items: 60% opacity (via `.item-wishlist` class)
- Favorite collections: Yellow border (via `.item-favorite` class)

### Container Components

#### ItemList (`components/ItemList.jsx`)

Displays DBoT collections and items with filtering, sorting, and wishlist actions.

**Responsibilities:**
- Fetch DBoT collection items
- Track user ownership
- Handle filtering and sorting
- Manage collection navigation
- Provide Filter and Wishlist actions

**Does NOT:**
- Manage user's custom collections (see MyCollection)
- Handle CRUD operations on collections

#### MyCollection (`components/MyCollection.jsx`)

Displays user's custom collections with owned items and wishlisted items.

**Responsibilities:**
- Fetch user's collection tree
- Display custom collections, owned items, wishlist items
- Provide Create Collection and Add Item actions
- Handle collection navigation via breadcrumbs
- Show progress for linked collections

**Does NOT:**
- Display DBoT collections (see ItemList)
- Provide filtering UI (custom collections are user-managed)

### Design Principles

1. **Composition over inheritance**: Build complex UIs from simple, reusable components
2. **Single responsibility**: Each component does one thing well
3. **Props over configuration**: Pass behavior through props, not global state
4. **Consistent styling**: Shared components ensure visual consistency

### Adding New Collection Views

To add a new collection view:

1. Use `CollectionHeader` for the header
2. Use `ItemGrid` for rendering items
3. Pass view-specific actions as props to CollectionHeader
4. Keep orchestration logic in your container component
5. Don't duplicate header or grid rendering logic

### Migration Notes

**Before refactoring:**
- ItemList: 681 lines (inline header + inline item rendering)
- MyCollection: 351 lines (inline header + inline item rendering)
- Duplicate CSS in both files

**After refactoring:**
- ItemList: ~350 lines (uses CollectionHeader + ItemGrid)
- MyCollection: ~250 lines (uses CollectionHeader + ItemGrid)
- CollectionHeader: ~150 lines (reusable)
- ItemGrid: ~50 lines (reusable)
- Shared CSS in CollectionHeader.css

**Benefits:**
- ~200 lines of code eliminated
- Header changes update both views automatically
- Item rendering consistent across app
- Easier to add new collection views

## Testing Checklist

### DBoT Collections (ItemList)

- [ ] Browse root page (favorites or random collections)
- [ ] Navigate into a DBoT collection
- [ ] Navigate into subcollections
- [ ] Filter button works
- [ ] Wishlist button works
- [ ] Click collection header opens detail
- [ ] Progress bar shows correct stats
- [ ] Items show owned/wishlist state

### User Collections (MyCollection)

- [ ] View root My Collection page
- [ ] Create new collection works
- [ ] Navigate into custom collections
- [ ] Add Item button works (if available)
- [ ] Progress bar shows owned/wishlist correctly
- [ ] Collections, owned items, wishlist items all render
- [ ] Wishlist items show at 60% opacity

### Shared Functionality

- [ ] All item cards use ItemCard component
- [ ] All collection headers use CollectionHeader
- [ ] Responsive design works on mobile
- [ ] No console errors
- [ ] No visual regressions

## Files Modified

**Created:**
- `src/components/CollectionHeader.jsx` (97 lines)
- `src/components/CollectionHeader.css` (125 lines)
- `src/components/ItemGrid.jsx` (58 lines)
- `docs/component-architecture.md` (this file)

**Modified:**
- `src/components/ItemList.jsx` (681 → ~350 lines, -331 lines)
- `src/components/MyCollection.jsx` (351 → ~250 lines, -101 lines)
- `src/components/ItemList.css` (removed 121 duplicate lines)

**Net Result:** ~550 fewer lines of code, better separation of concerns, easier maintenance.
