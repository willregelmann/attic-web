# TreePicker Component Architecture

## Visual Component Structure

```
┌─────────────────────────────────────────────────────┐
│                   TreePicker                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │  Root Item (optional, allowRoot=true)      │   │
│  │  📁 Root (uncategorized)          [Select] │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │  TreeNode (level 0)                        │   │
│  │  ▼ 📁 Pokemon Cards               [Select] │   │
│  │                                             │   │
│  │    ┌──────────────────────────────────┐    │   │
│  │    │  TreeNode (level 1)              │    │   │
│  │    │  ▶ 📁 Base Set         [Select]  │    │   │
│  │    └──────────────────────────────────┘    │   │
│  │    ┌──────────────────────────────────┐    │   │
│  │    │  TreeNode (level 1, expanded)    │    │   │
│  │    │  ▼ 📁 Modern Sets      [Select]  │    │   │
│  │    │                                   │    │   │
│  │    │     ┌────────────────────────┐   │    │   │
│  │    │     │ TreeNode (level 2)     │   │    │   │
│  │    │     │ 📁 Scarlet [Select]   │   │    │   │
│  │    │     └────────────────────────┘   │    │   │
│  │    └──────────────────────────────────┘    │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │  TreeNode (level 0)                        │   │
│  │  ▶ 📁 Magic: The Gathering     [Select]    │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │  Create Item (optional, allowCreate=true)  │   │
│  │  + Create new collection                   │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
TreePicker (parent component)
│
├─── Root Item (conditional: allowRoot)
│    └─── [Select Button]
│
├─── TreeNode[] (for each root collection)
│    │
│    ├─── Toggle Button (▶/▼)
│    ├─── Folder Icon (📁)
│    ├─── Collection Label
│    ├─── [Select Button]
│    │
│    └─── TreeNode[] (recursive children, if expanded)
│         │
│         ├─── Toggle Button (▶/▼)
│         ├─── Folder Icon (📁)
│         ├─── Collection Label
│         ├─── [Select Button]
│         │
│         └─── TreeNode[] (recursive, unlimited depth)
│
└─── Create Item (conditional: allowCreate)
```

## Data Flow Diagram

```
┌──────────────────┐
│  Parent Component│
│  (e.g., Modal)   │
└────────┬─────────┘
         │
         │ collections[] (props)
         │ onSelect() (callback)
         │ selectedId (state)
         ↓
┌─────────────────────────────────┐
│        TreePicker               │
│                                 │
│  1. buildTree(collections)      │
│     └─> hierarchical tree data │
│                                 │
│  2. expandedIds (Set)           │
│     └─> track open folders     │
│                                 │
│  3. Render TreeNodes            │
│     └─> recursive rendering    │
└───────────┬─────────────────────┘
            │
            │ User clicks "Select"
            │
            ↓
┌───────────────────────────┐
│   onSelect(collectionId)  │
│                           │
│   Callback to parent      │
└───────────────────────────┘
            │
            │
            ↓
┌───────────────────────────┐
│   Parent updates state    │
│   selectedId = newId      │
└───────────────────────────┘
            │
            │
            ↓ (re-render)
┌───────────────────────────┐
│   TreePicker highlights   │
│   selected item           │
└───────────────────────────┘
```

## State Management

```
TreePicker Component State
│
├─── expandedIds: Set<string>
│    │
│    ├─── toggleExpand(id)
│    │    ├─> if expanded: remove from Set
│    │    └─> if collapsed: add to Set
│    │
│    └─── isExpanded = expandedIds.has(id)
│
└─── treeData: Array (computed via useMemo)
     │
     └─── buildTree(collections)
          │
          ├─> 1st pass: Create Map of all collections
          ├─> 2nd pass: Build parent-child relationships
          └─> Return root nodes with nested children
```

## Tree Building Algorithm

```
Input: Flat array
[
  { id: '1', name: 'Pokemon', parent_collection_id: null },
  { id: '2', name: 'Base Set', parent_collection_id: '1' },
  { id: '3', name: 'Jungle', parent_collection_id: '1' },
  { id: '4', name: 'MTG', parent_collection_id: null }
]

Step 1: Create Map
collectionsMap = {
  '1': { id: '1', name: 'Pokemon', parent_collection_id: null, children: [] },
  '2': { id: '2', name: 'Base Set', parent_collection_id: '1', children: [] },
  '3': { id: '3', name: 'Jungle', parent_collection_id: '1', children: [] },
  '4': { id: '4', name: 'MTG', parent_collection_id: null, children: [] }
}

Step 2: Build Hierarchy
- '1' has no parent → add to roots[]
- '2' has parent '1' → add to collectionsMap.get('1').children[]
- '3' has parent '1' → add to collectionsMap.get('1').children[]
- '4' has no parent → add to roots[]

Step 3: Sort alphabetically (recursive)
- Sort roots by name
- Sort children of each node by name

Output: Hierarchical tree
[
  {
    id: '1',
    name: 'Pokemon',
    parent_collection_id: null,
    children: [
      { id: '2', name: 'Base Set', parent_collection_id: '1', children: [] },
      { id: '3', name: 'Jungle', parent_collection_id: '1', children: [] }
    ]
  },
  {
    id: '4',
    name: 'MTG',
    parent_collection_id: null,
    children: []
  }
]
```

## Interaction Flow

```
User Action                  Component Response              Visual Feedback
────────────────────────────────────────────────────────────────────────────

Click arrow (▶)         →   toggleExpand(id)           →    Arrow rotates to ▼
                            Add to expandedIds Set          Children slide down
                                                            (200ms animation)

Click arrow (▼)         →   toggleExpand(id)           →    Arrow rotates to ▶
                            Remove from expandedIds Set     Children slide up
                                                            (200ms animation)

Hover collection        →   CSS :hover state           →    Background color change
                                                            Select button fades in

Click "Select"          →   onSelect(collectionId)     →    Blue left border
                            Parent updates selectedId       Background tint
                                                            Select button darkens

Click folder name       →   toggleExpand(id)           →    Same as clicking arrow
(if has children)           (same behavior)

Click "Root"            →   onSelect(null)             →    Root item highlighted
                            Parent receives null
```

## Performance Characteristics

```
Operation               Time Complexity    Space Complexity
─────────────────────────────────────────────────────────────
buildTree()             O(n)              O(n)
toggleExpand()          O(1)              O(k)  k = expanded count
onSelect()              O(1)              O(1)
Render (visible only)   O(v)              O(v)  v = visible nodes
Re-render (memoized)    O(v)              O(v)  Only if deps change

n = total collections
v = visible (expanded) nodes
k = number of expanded folders
```

## CSS Class Structure

```
.tree-picker                  (container)
│
├─── .tree-item               (each row)
│    ├─── .root-item         (modifier: root option)
│    ├─── .create-item       (modifier: create option)
│    └─── .selected          (modifier: selected state)
│
├─── .tree-item-content       (left side of row)
│    ├─── .tree-toggle       (expand/collapse button)
│    ├─── .tree-spacer       (empty space for alignment)
│    ├─── .tree-icon         (folder icon)
│    └─── .tree-label        (collection name)
│
├─── .select-button           (right side of row)
│
├─── .tree-children           (container for nested items)
│
└─── .tree-empty              (empty state)
```

## Integration Points

```
┌──────────────────────────────────────────────────────────┐
│                  AddCollectionModal                      │
│                      (Task 10)                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  GraphQL Query: GET_USER_COLLECTIONS                     │
│  └─> collections[]                                       │
│       │                                                  │
│       ↓                                                  │
│  ┌────────────────────────────────────────────────┐     │
│  │             TreePicker                          │     │
│  │                                                 │     │
│  │  User selects collection                       │     │
│  └────────────────────────────────────────────────┘     │
│       │                                                  │
│       ↓                                                  │
│  selectedCollectionId (state)                            │
│       │                                                  │
│       ↓                                                  │
│  [Save Button]                                           │
│       │                                                  │
│       ↓                                                  │
│  GraphQL Mutation: ADD_WISHLIST_ITEM_TO_COLLECTION       │
│  └─> Move item from wishlist to selected collection     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## File Dependencies

```
TreePicker.jsx
│
├─── React (useState, useMemo)
├─── Lucide React (Folder, ChevronRight, ChevronDown)
└─── TreePicker.css

TreePicker.css
│
└─── index.css (CSS variables)
     ├─── --bg-primary
     ├─── --bg-secondary
     ├─── --border-color
     ├─── --text-primary
     ├─── --text-secondary
     ├─── --bright-blue
     └─── --navy-blue
```

## Responsive Breakpoints

```
Desktop (> 768px)                Mobile (≤ 768px)
─────────────────────────────────────────────────────
Max height: 400px               Max height: 60vh
Select buttons: on hover        Select buttons: always visible
Toggle size: 20px               Toggle size: 28px
Font size: 0.875rem             Font size: 0.9375rem
Indentation: 20px/level         Indentation: 20px/level (same)
```

## Summary

- **Component**: TreePicker.jsx (246 lines)
- **Styling**: TreePicker.css (282 lines)
- **Architecture**: Recursive component tree
- **State**: Single Set for expand/collapse
- **Performance**: O(n) tree build, O(1) interactions
- **Accessibility**: Full ARIA, keyboard, focus support
- **Integration**: Ready for AddCollectionModal (Task 10)
