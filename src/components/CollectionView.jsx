import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { GET_COLLECTION } from '../queries';
import { useAuth } from '../contexts/AuthContext';
import ItemList from './ItemList';
import { CollectionHeaderSkeleton, ItemListSkeleton } from './SkeletonLoader';

function CollectionView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // If no ID, we're at the root
  const isRoot = !id || id === 'root';

  // Fetch collection data if not root
  const { data, loading, error, refetch } = useQuery(GET_COLLECTION, {
    variables: { id: id },
    skip: isRoot,
    fetchPolicy: 'cache-and-network'
  });

  // Create virtual root collection based on auth state
  const getRootCollection = () => {
    if (isAuthenticated) {
      return {
        id: 'root',
        name: 'My Starred Collections',
        type: 'COLLECTION',
        metadata: {
          description: 'Your favorite collections'
        }
      };
    } else {
      return {
        id: 'root',
        name: 'Featured Collections',
        type: 'COLLECTION',
        metadata: {
          description: 'Explore collectibles from various collections'
        }
      };
    }
  };

  const collection = isRoot ? getRootCollection() : (data?.collection || null);

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
      <div className="item-list">
        <div className="back-button-wrapper">
          <button className="back-button" disabled>
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Collections
          </button>
        </div>
        <CollectionHeaderSkeleton />
        <ItemListSkeleton count={12} />
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
      onRefresh={refetch}
    />
  );
}

export default CollectionView;