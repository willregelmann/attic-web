# AddCollectionModal - Component Structure

## Visual Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Add Collection to Wishlist                             [X]  │  ← Header
│  Pokemon Base Set                                            │  ← Subtitle
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  How would you like to add this collection?                 │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ (•) Track this collection (linked)                 │    │  ← Radio 1
│  │     Track official completion with dual progress   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ( ) Add items to existing collection               │    │  ← Radio 2
│  │     Add items to a custom collection               │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ─────────────────────────────────────────────────────      │
│                                                              │
│  IF TRACK MODE:                                             │
│                                                              │
│    Collection Name *                                        │
│    ┌──────────────────────────────────────────────┐        │  ← Text Input
│    │ Pokemon Base Set                             │        │
│    └──────────────────────────────────────────────┘        │
│                                                              │
│    Parent Collection (optional)                             │
│    Choose where to place this collection...                │
│    ┌──────────────────────────────────────────────┐        │
│    │ 📁 Root (uncategorized)           [Select]  │        │
│    │ 📁 Pokemon                        [Select]  │        │  ← TreePicker
│    │   📁 Trading Cards                [Select]  │        │
│    │   📁 Figures                      [Select]  │        │
│    └──────────────────────────────────────────────┘        │
│                                                              │
│  IF ADD TO EXISTING MODE:                                   │
│                                                              │
│    Target Collection *                                      │
│    Select the collection to add all items to               │
│    ┌──────────────────────────────────────────────┐        │
│    │ 📁 Root (uncategorized)           [Select]  │        │
│    │ 📁 Want to Buy                    [Select]  │        │  ← TreePicker
│    │ 📁 Childhood Favorites            [Select]  │        │
│    └──────────────────────────────────────────────┘        │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                      [Cancel] [Track Collection] │  ← Footer
└──────────────────────────────────────────────────────────────┘
```

## Component Tree

```
AddCollectionModal
├── modal-overlay (div)
│   onClick: onClose
│
└── add-collection-modal (div)
    onClick: stopPropagation
    │
    ├── modal-header (div)
    │   ├── header-content (div)
    │   │   ├── h2: "Add Collection to Wishlist"
    │   │   └── p.collection-subtitle: dbotCollection.name
    │   │
    │   └── modal-close (button)
    │       └── X icon (svg)
    │
    ├── modal-content (div)
    │   │
    │   ├── modal-section (div) - Mode Selection
    │   │   ├── h3: "How would you like to add this collection?"
    │   │   │
    │   │   └── mode-options (div)
    │   │       │
    │   │       ├── mode-option (label) - Track Mode
    │   │       │   ├── input[type="radio"]
    │   │       │   └── mode-content (div)
    │   │       │       ├── mode-header (div)
    │   │       │       │   ├── radio-indicator (span)
    │   │       │       │   └── mode-title (span)
    │   │       │       └── mode-description (p)
    │   │       │
    │   │       └── mode-option (label) - Add to Existing Mode
    │   │           ├── input[type="radio"]
    │   │           └── mode-content (div)
    │   │               ├── mode-header (div)
    │   │               │   ├── radio-indicator (span)
    │   │               │   └── mode-title (span)
    │   │               └── mode-description (p)
    │   │
    │   ├── IF mode === 'track':
    │   │   │
    │   │   ├── modal-section (div) - Collection Name
    │   │   │   ├── label.field-label.required
    │   │   │   └── input.text-input
    │   │   │
    │   │   └── modal-section (div) - Parent Collection
    │   │       ├── label.field-label
    │   │       ├── p.field-description
    │   │       └── tree-picker-container (div)
    │   │           └── <TreePicker />
    │   │
    │   ├── IF mode === 'add_to_existing':
    │   │   │
    │   │   └── modal-section (div) - Target Collection
    │   │       ├── label.field-label.required
    │   │       ├── p.field-description
    │   │       └── tree-picker-container (div)
    │   │           └── <TreePicker />
    │   │
    │   └── IF error:
    │       │
    │       └── error-message (div)
    │           ├── error icon (svg)
    │           └── error text
    │
    └── modal-footer (div)
        ├── btn-cancel (button)
        │   └── "Cancel"
        │
        └── btn-confirm (button)
            └── IF loading:
                ├── spinner (span)
                └── "Adding..."
                ELSE IF mode === 'track':
                └── "Track Collection"
                ELSE:
                └── "Add Items"
```

## State Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Modal Opens (isOpen: true)                                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ useEffect: Reset State                                      │
│ - mode = 'track'                                            │
│ - collectionName = dbotCollection.name                      │
│ - selectedCollectionId = null                               │
│ - error = null                                              │
│ - loading = false                                           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ useQuery: Fetch MY_COLLECTION_TREE                          │
│ - Skipped if isOpen === false                               │
│ - Provides collections for TreePicker                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ User Interaction Loop                                       │
│                                                              │
│ • Select mode (track / add_to_existing)                     │
│ • Enter collection name (track mode)                        │
│ • Select collection from TreePicker                         │
│                                                              │
│ ┌────────────────────────────────────┐                     │
│ │ isFormValid() checks:              │                     │
│ │ - Track: collectionName.length > 0 │                     │
│ │ - Add: selectedCollectionId !== null│                    │
│ └────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Click Submit (btn-confirm)                                  │
│ - Disabled if !isFormValid() || loading                     │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ handleSubmit()                                              │
│ 1. setLoading(true)                                         │
│ 2. setError(null)                                           │
│ 3. Build variables based on mode                            │
│ 4. Call addCollectionToWishlist mutation                    │
└─────────────────────────────────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
┌─────────────────────┐   ┌─────────────────────┐
│ Success             │   │ Error               │
│ - onSuccess(result) │   │ - setError(message) │
│ - onClose()         │   │ - setLoading(false) │
└─────────────────────┘   └─────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ Modal Closes (isOpen: false)                                │
└─────────────────────────────────────────────────────────────┘
```

## GraphQL Variables by Mode

### Track Mode Variables
```javascript
{
  dbot_collection_id: "dbot_123",        // Always required
  mode: "TRACK",                         // Mode constant
  new_collection_name: "Pokemon Base Set", // User input (required)
  target_collection_id: null             // Optional (parent collection)
}
```

### Add to Existing Mode Variables
```javascript
{
  dbot_collection_id: "dbot_123",        // Always required
  mode: "ADD_TO_EXISTING",               // Mode constant
  target_collection_id: "collection_456" // User selection (required)
}
```

## Event Handlers

### User Events
```javascript
// Radio button change
onChange={(e) => setMode(e.target.value)}

// Text input change
onChange={(e) => setCollectionName(e.target.value)}

// TreePicker selection
onSelect={setSelectedCollectionId}

// Cancel button
onClick={onClose}

// Submit button
onClick={handleSubmit}

// Close button
onClick={onClose}

// Overlay click
onClick={onClose}

// Modal content click (prevent close)
onClick={(e) => e.stopPropagation()}
```

### Keyboard Events
```javascript
// Escape key listener (useEffect)
document.addEventListener('keydown', handleEscape)

handleEscape = (e) => {
  if (e.key === 'Escape' && isOpen) {
    onClose();
  }
}
```

## CSS Class Hierarchy

```css
.modal-overlay                        /* Fixed overlay, rgba backdrop */
  .add-collection-modal              /* Centered modal container */
    .modal-header                    /* Header with title */
      .header-content                /* Flex container for titles */
        h2                           /* Main title */
        .collection-subtitle         /* DBoT collection name */
      .modal-close                   /* Close button (X) */

    .modal-content                   /* Scrollable content area */
      .modal-section                 /* Section container */
        h3                           /* Section heading */

        .mode-options                /* Radio buttons container */
          .mode-option               /* Radio option (label) */
            .mode-content            /* Radio content wrapper */
              .mode-header           /* Radio title row */
                .radio-indicator     /* Custom radio circle */
                .mode-title          /* Radio label text */
              .mode-description      /* Radio description text */

        .field-label                 /* Form field label */
        .field-description           /* Field help text */
        .text-input                  /* Text input field */

        .tree-picker-container       /* TreePicker wrapper */
          <TreePicker />             /* External component */

        .error-message               /* Error display */
          svg                        /* Error icon */

    .modal-footer                    /* Footer with buttons */
      .btn-cancel                    /* Cancel button */
      .btn-confirm                   /* Submit button */
        .spinner                     /* Loading spinner */
```

## Responsive Behavior

### Desktop (>1024px)
```
┌─────────────────────────────────────────────┐
│  Add Collection to Wishlist            [X]  │
│  Pokemon Base Set                           │
├─────────────────────────────────────────────┤
│  [Mode selection with horizontal layout]   │
│  [Form fields with full padding]           │
│  [TreePicker: 300px max-height]            │
├─────────────────────────────────────────────┤
│                      [Cancel] [Submit]      │ ← Horizontal
└─────────────────────────────────────────────┘
Max-width: 700px
```

### Mobile (<768px)
```
┌──────────────────────────────┐
│  Add Collection         [X]  │
│  Pokemon Base Set            │
├──────────────────────────────┤
│  [Mode selection stacked]    │
│  [Form fields reduced pad]   │
│  [TreePicker: 250px max-h]   │
├──────────────────────────────┤
│  [Submit - Full width]       │ ← Vertical
│  [Cancel - Full width]       │
└──────────────────────────────┘
Width: 95%
```

## Accessibility Attributes

```javascript
// Close button
aria-label="Close modal"

// Radio buttons (implicit through label)
<label className="mode-option">
  <input type="radio" ... />
  <div>Track this collection</div>
</label>

// Text input
<label htmlFor="collection-name">Collection Name *</label>
<input id="collection-name" ... />

// TreePicker select buttons
aria-label="Select root collection"
aria-label={`Select ${node.name}`}

// TreePicker expand/collapse
aria-label={isExpanded ? 'Collapse' : 'Expand'}
aria-expanded={isExpanded}
```

## Component Lifecycle

```
1. Component Mount
   └── Render with isOpen=false (returns null)

2. Modal Opens (isOpen=true)
   ├── useEffect: Reset form state
   ├── useQuery: Fetch MY_COLLECTION_TREE
   ├── Render modal with animations
   └── useEffect: Add keyboard listener

3. User Interaction
   ├── Switch modes → setMode()
   ├── Type collection name → setCollectionName()
   ├── Select collection → setSelectedCollectionId()
   └── Validation updates → isFormValid()

4. Form Submission
   ├── handleSubmit()
   ├── setLoading(true)
   ├── GraphQL mutation
   ├── onSuccess(result) / setError()
   └── onClose() [if success]

5. Modal Closes (isOpen=false)
   ├── useEffect cleanup: Remove keyboard listener
   └── Render null (component unmounts from DOM)
```

## File Dependencies

```
AddCollectionModal.jsx
├── React
│   ├── useState
│   └── useEffect
├── @apollo/client
│   ├── useQuery
│   └── useMutation
├── ../queries.js
│   ├── ADD_COLLECTION_TO_WISHLIST
│   └── MY_COLLECTION_TREE
├── TreePicker.jsx
└── AddCollectionModal.css

AddCollectionModal.css
└── Global CSS Variables
    ├── --white
    ├── --navy-blue
    ├── --text-primary
    └── --text-secondary
```
