import { useNavigate } from 'react-router-dom';
import ItemList from './ItemList';

function MyCollection({ onAddToCollection }) {
  const navigate = useNavigate();

  // Create virtual collection for My Collection
  const virtualCollection = {
    id: 'my-collection',
    name: 'My Collection',
    type: 'COLLECTION',
    year: null,
    image_url: null,
    metadata: {
      description: 'Items you own'
    }
  };

  const handleSelectCollection = (selectedCollection) => {
    navigate(`/collection/${selectedCollection.id}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <ItemList
      collection={virtualCollection}
      onBack={handleBack}
      onSelectCollection={handleSelectCollection}
      isRootView={false}
      onRefresh={() => {}}
      navigationPath={[]}
      onAddToCollection={onAddToCollection}
    />
  );
}

export default MyCollection;
