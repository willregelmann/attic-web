import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { GET_COLLECTION } from '../queries';
import ItemList from './ItemList';

function CollectionView() {
  const { id } = useParams();
  const navigate = useNavigate();

  console.log('CollectionView rendering with id:', id);

  // Create a virtual root collection for the home page
  const rootCollection = {
    id: 'root',
    name: 'All Collections',
    type: 'COLLECTION',
    metadata: {
      description: 'Browse all available collections'
    }
  };

  // If no ID, we're at the root
  const isRoot = !id || id === 'root';

  // Fetch collection data if not root
  const { data, loading, error } = useQuery(GET_COLLECTION, {
    variables: { id: id },
    skip: isRoot,
    fetchPolicy: 'cache-and-network' // Ensure we get fresh data
  });

  console.log('Query result:', { data, loading, error, isRoot });

  const collection = isRoot ? rootCollection : (data?.collection || null);

  const handleSelectCollection = (selectedCollection) => {
    // Navigate to the collection's URL
    navigate(`/collection/${selectedCollection.id}`);
  };

  const handleBack = () => {
    // Navigate back in history
    navigate(-1);
  };

  if (!isRoot && loading) {
    return (
      <div className="items-loading">
        <div className="loading-spinner"></div>
        <p>Loading collection...</p>
      </div>
    );
  }

  if (!isRoot && error) {
    return (
      <div className="items-error">
        <h3>Error loading collection</h3>
        <p>{error.message}</p>
        <button onClick={() => navigate('/')}>Back to Collections</button>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="items-error">
        <h3>Collection not found</h3>
        <button onClick={() => navigate('/')}>Back to Collections</button>
      </div>
    );
  }

  return (
    <ItemList
      collection={collection}
      onBack={handleBack}
      onSelectCollection={handleSelectCollection}
      isRootView={isRoot}
    />
  );
}

export default CollectionView;