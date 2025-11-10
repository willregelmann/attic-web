/**
 * AddCollectionModal - Usage Example
 *
 * This file demonstrates how to integrate and use the AddCollectionModal component
 */

import { useState } from 'react';
import AddCollectionModal from './AddCollectionModal';

function ExampleUsage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Example DBoT collection object (would come from GraphQL query)
  const exampleDbotCollection = {
    id: 'dbot_123',
    name: 'Pokemon Base Set',
    type: 'trading_card_set',
    year: 1999,
    image_url: 'https://example.com/base-set.jpg'
  };

  const handleSuccess = (result) => {
    console.log('Collection added successfully!', result);
    // result contains:
    // - collection_id: ID of created/updated collection
    // - items_added: Number of items added
    // - items_already_owned: Number of items already in collection
    // - message: Success message

    // Optionally show toast notification or update UI
    alert(`Successfully added ${result.items_added} items to your wishlist!`);
  };

  return (
    <div>
      {/* Trigger button */}
      <button onClick={() => setIsModalOpen(true)}>
        Add Collection to Wishlist
      </button>

      {/* Modal component */}
      <AddCollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dbotCollection={exampleDbotCollection}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

export default ExampleUsage;

/**
 * INTEGRATION NOTES:
 *
 * 1. Import the component:
 *    import AddCollectionModal from './components/AddCollectionModal';
 *
 * 2. Add state to control modal visibility:
 *    const [isAddCollectionModalOpen, setIsAddCollectionModalOpen] = useState(false);
 *
 * 3. Get DBoT collection from your existing queries (e.g., from CollectionView):
 *    const { data } = useQuery(GET_DATABASE_OF_THINGS_ENTITY, {
 *      variables: { id: collectionId }
 *    });
 *
 * 4. Add trigger button in your UI (e.g., in CollectionView):
 *    <button onClick={() => setIsAddCollectionModalOpen(true)}>
 *      Add to Wishlist
 *    </button>
 *
 * 5. Render the modal:
 *    <AddCollectionModal
 *      isOpen={isAddCollectionModalOpen}
 *      onClose={() => setIsAddCollectionModalOpen(false)}
 *      dbotCollection={data?.databaseOfThingsEntity}
 *      onSuccess={(result) => {
 *        // Show success message
 *        // Optionally refetch collection tree
 *      }}
 *    />
 *
 * ACCESSIBILITY FEATURES:
 * - Escape key closes modal
 * - Click outside overlay closes modal
 * - Proper ARIA labels on all interactive elements
 * - Keyboard navigation through form fields
 * - Focus management (autofocus on collection name input)
 *
 * MOBILE RESPONSIVENESS:
 * - Modal width adjusts to 95% on mobile
 * - Footer buttons stack vertically on mobile
 * - TreePicker height reduced on mobile for better scrolling
 * - Touch-friendly button sizes (44px minimum)
 *
 * VALIDATION:
 * - Track mode: Collection name is required (non-empty)
 * - Add to Existing mode: Target collection selection is required
 * - Submit button disabled until validation passes
 *
 * ERROR HANDLING:
 * - GraphQL errors displayed in red error box
 * - Loading state prevents double submissions
 * - User-friendly error messages
 */
