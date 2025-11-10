# TreePicker Quick Start Guide

## Installation (One Line)

```javascript
import TreePicker from './components/TreePicker';
```

## Basic Usage (Copy-Paste Ready)

```javascript
import { useState } from 'react';
import TreePicker from './components/TreePicker';

function MyComponent() {
  const [selectedId, setSelectedId] = useState(null);

  // Your collections data (from GraphQL, props, etc.)
  const collections = [
    { id: '1', name: 'Pokemon Cards', parent_collection_id: null },
    { id: '2', name: 'Base Set', parent_collection_id: '1' },
    { id: '3', name: 'Jungle Set', parent_collection_id: '1' },
  ];

  return (
    <TreePicker
      collections={collections}
      onSelect={setSelectedId}
      selectedId={selectedId}
    />
  );
}
```

## Props (5 Total)

| Prop | Type | Default | Example |
|------|------|---------|---------|
| `collections` | Array | `[]` | `[{ id: '1', name: 'Cards', parent_collection_id: null }]` |
| `onSelect` | Function | - | `(id) => setSelectedId(id)` |
| `selectedId` | String | `null` | `'collection-123'` |
| `allowRoot` | Boolean | `false` | `true` |
| `allowCreate` | Boolean | `false` | `true` |

## Collection Object Format

```javascript
{
  id: '1',                       // Required: Unique ID
  name: 'My Collection',         // Required: Display name
  parent_collection_id: null     // Required: Parent ID or null
}
```

## Common Use Cases

### 1. In a Modal

```javascript
function AddToCollectionModal({ onSave, onClose }) {
  const [selectedId, setSelectedId] = useState(null);
  const { data } = useQuery(GET_USER_COLLECTIONS);

  return (
    <div className="modal">
      <TreePicker
        collections={data?.userCollections || []}
        onSelect={setSelectedId}
        allowRoot={true}
        selectedId={selectedId}
      />
      <button onClick={() => onSave(selectedId)}>Save</button>
    </div>
  );
}
```

### 2. With Root Option

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
  selectedId={selectedId}
/>
```

### 3. With Create Option

```javascript
<TreePicker
  collections={collections}
  onSelect={setSelectedId}
  allowCreate={true}
  selectedId={selectedId}
/>
```

## Visual Output

```
📁 Root (uncategorized)         [Select]
📁 Pokemon Cards                [Select]
  ▶ 📁 Base Set                [Select]
  ▼ 📁 Modern Sets             [Select]
      📁 Scarlet & Violet      [Select]
      📁 Sword & Shield        [Select]
+ Create new collection
```

## onSelect Callback

```javascript
const handleSelect = (collectionId) => {
  // collectionId is either:
  // - null (if root selected)
  // - string (collection ID)

  if (collectionId === null) {
    console.log('User selected root');
  } else {
    console.log('User selected collection:', collectionId);
    // Save to state, make GraphQL mutation, etc.
  }
};
```

## Styling

Already styled! Uses CSS variables from `index.css`:
- `--bg-primary` (container background)
- `--bright-blue` (icons, buttons)
- `--text-primary` (text color)
- Supports dark mode automatically

## Testing

Test page available at:
```javascript
import TreePickerTest from './components/TreePicker.test';

// Add to routes
<Route path="/test-tree-picker" element={<TreePickerTest />} />
```

Visit: `http://localhost:5173/test-tree-picker`

## That's It!

Three things you need:
1. Import component
2. Pass collections array
3. Handle onSelect callback

See `TreePicker.README.md` for complete documentation.
