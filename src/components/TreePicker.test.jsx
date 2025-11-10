import { useState } from 'react';
import TreePicker from './TreePicker';
import './TreePicker.test.css';

/**
 * Test/Demo page for TreePicker component
 * This demonstrates all features and usage patterns
 */
function TreePickerTest() {
  const [selectedId, setSelectedId] = useState(null);
  const [selectedName, setSelectedName] = useState('None');

  // Test data: nested collections with realistic structure
  const testCollections = [
    // Root level collections
    { id: '1', name: 'Pokemon Cards', parent_collection_id: null },
    { id: '2', name: 'Magic: The Gathering', parent_collection_id: null },
    { id: '3', name: 'Yu-Gi-Oh!', parent_collection_id: null },

    // Pokemon subcollections
    { id: '1a', name: 'Base Set', parent_collection_id: '1' },
    { id: '1b', name: 'Jungle Set', parent_collection_id: '1' },
    { id: '1c', name: 'Fossil Set', parent_collection_id: '1' },
    { id: '1d', name: 'Modern Sets', parent_collection_id: '1' },

    // Modern Sets subcollections
    { id: '1d1', name: 'Scarlet & Violet', parent_collection_id: '1d' },
    { id: '1d2', name: 'Sword & Shield', parent_collection_id: '1d' },
    { id: '1d3', name: 'Sun & Moon', parent_collection_id: '1d' },

    // MTG subcollections
    { id: '2a', name: 'Alpha Edition', parent_collection_id: '2' },
    { id: '2b', name: 'Beta Edition', parent_collection_id: '2' },
    { id: '2c', name: 'Modern Sets', parent_collection_id: '2' },

    // Yu-Gi-Oh subcollections
    { id: '3a', name: 'Legend of Blue Eyes', parent_collection_id: '3' },
    { id: '3b', name: 'Metal Raiders', parent_collection_id: '3' },
  ];

  // Handle selection
  const handleSelect = (collectionId) => {
    setSelectedId(collectionId);

    if (collectionId === null) {
      setSelectedName('Root (uncategorized)');
    } else {
      const collection = testCollections.find(c => c.id === collectionId);
      setSelectedName(collection ? collection.name : 'Unknown');
    }
  };

  return (
    <div className="tree-picker-test">
      <h1>TreePicker Component Test</h1>

      {/* Current selection display */}
      <div className="selection-display">
        <strong>Selected:</strong> {selectedName}
        {selectedId && <span className="selection-id"> (ID: {selectedId})</span>}
      </div>

      {/* Test Case 1: Full features */}
      <section className="test-section">
        <h2>Test 1: All Features Enabled</h2>
        <p>Shows root option, create option, and hierarchical collections</p>
        <TreePicker
          collections={testCollections}
          onSelect={handleSelect}
          allowRoot={true}
          allowCreate={true}
          selectedId={selectedId}
        />
      </section>

      {/* Test Case 2: No special options */}
      <section className="test-section">
        <h2>Test 2: Collections Only</h2>
        <p>No root or create options</p>
        <TreePicker
          collections={testCollections}
          onSelect={handleSelect}
          allowRoot={false}
          allowCreate={false}
          selectedId={selectedId}
        />
      </section>

      {/* Test Case 3: Flat list (no nesting) */}
      <section className="test-section">
        <h2>Test 3: Flat Collection List</h2>
        <p>All collections at root level</p>
        <TreePicker
          collections={[
            { id: 'a', name: 'Collection A', parent_collection_id: null },
            { id: 'b', name: 'Collection B', parent_collection_id: null },
            { id: 'c', name: 'Collection C', parent_collection_id: null },
          ]}
          onSelect={handleSelect}
          allowRoot={true}
          selectedId={selectedId}
        />
      </section>

      {/* Test Case 4: Empty state */}
      <section className="test-section">
        <h2>Test 4: Empty Collections</h2>
        <p>No collections available</p>
        <TreePicker
          collections={[]}
          onSelect={handleSelect}
          allowRoot={false}
          allowCreate={false}
          selectedId={selectedId}
        />
      </section>

      {/* Test Case 5: Deep nesting */}
      <section className="test-section">
        <h2>Test 5: Deep Nesting</h2>
        <p>Testing 4+ levels of hierarchy</p>
        <TreePicker
          collections={[
            { id: 'l1', name: 'Level 1', parent_collection_id: null },
            { id: 'l2', name: 'Level 2', parent_collection_id: 'l1' },
            { id: 'l3', name: 'Level 3', parent_collection_id: 'l2' },
            { id: 'l4', name: 'Level 4', parent_collection_id: 'l3' },
            { id: 'l5', name: 'Level 5', parent_collection_id: 'l4' },
          ]}
          onSelect={handleSelect}
          selectedId={selectedId}
        />
      </section>

      {/* Usage Instructions */}
      <section className="test-section usage-section">
        <h2>Usage Example</h2>
        <pre className="code-block">
{`import TreePicker from './components/TreePicker';

function MyComponent() {
  const [selectedId, setSelectedId] = useState(null);

  const collections = [
    { id: '1', name: 'Trading Cards', parent_collection_id: null },
    { id: '2', name: 'Pokemon', parent_collection_id: '1' },
    { id: '3', name: 'Base Set', parent_collection_id: '2' },
  ];

  return (
    <TreePicker
      collections={collections}
      onSelect={setSelectedId}
      allowRoot={true}
      allowCreate={false}
      selectedId={selectedId}
    />
  );
}`}
        </pre>
      </section>
    </div>
  );
}

export default TreePickerTest;
