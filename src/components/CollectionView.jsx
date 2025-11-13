import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { useEffect, useMemo } from 'react';
import { GET_DATABASE_OF_THINGS_ENTITY } from '../queries';
import { useAuth } from '../contexts/AuthContext';
import { useCollectionFilter } from '../contexts/CollectionFilterContext';
import ItemList from './ItemList';
import { CollectionHeaderSkeleton, ItemListSkeleton } from './SkeletonLoader';
import { addToRecentlyViewed } from '../utils/recentlyViewed';

function CollectionView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { setActiveCollection } = useCollectionFilter();

  // If no ID, we're at the root
  const isRoot = !id || id === 'root';

  // Get navigation path from URL query params
  // Path format: "id1:name1,id2:name2,id3:name3"
  const pathParam = searchParams.get('path');
  const navigationPath = useMemo(() =>
    pathParam
      ? pathParam.split(',').map(item => {
          const [id, ...nameParts] = item.split(':');
          return { id, name: decodeURIComponent(nameParts.join(':')) }; // Join back in case name contains ':'
        })
      : [],
    [pathParam]
  );

  // Fetch collection data if not root
  const { data, loading, error, refetch } = useQuery(GET_DATABASE_OF_THINGS_ENTITY, {
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

  const collection = isRoot ? getRootCollection() : (data?.databaseOfThingsEntity || null);

  // Track collection views
  useEffect(() => {
    if (collection && !isRoot) {
      addToRecentlyViewed(collection);
    }
  }, [collection, isRoot]);

  // Set active collection
  useEffect(() => {
    if (!isRoot && id) {
      setActiveCollection(id);
    }
  }, [id, isRoot, setActiveCollection]);

  const handleSelectCollection = (selectedCollection) => {
    // Build new path: ancestors + current collection
    // The path represents how we got TO the selected collection (not including it)
    // Format: "id:name,id:name,id:name"
    const newPath = isRoot
      ? [] // From root, no ancestors
      : [
          ...navigationPath.map(p => `${p.id}:${encodeURIComponent(p.name)}`),
          `${id}:${encodeURIComponent(collection.name)}`
        ];

    // Navigate to the collection's URL with updated path
    const pathParam = newPath.length > 0 ? `?path=${newPath.join(',')}` : '';
    navigate(`/collection/${selectedCollection.id}${pathParam}`);
  };

  const handleBack = () => {
    // Navigate back in history
    navigate(-1);
  };

  if (!isRoot && loading) {
    return (
      <div className="item-list">
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
      navigationPath={navigationPath}
    />
  );
}

export default CollectionView;