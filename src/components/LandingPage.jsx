import { useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { GET_DATABASE_OF_THINGS_COLLECTIONS } from '../queries';
import { getRecentlyViewed } from '../utils/recentlyViewed';
import { useBreadcrumbs } from '../contexts/BreadcrumbsContext';
import { ItemCard } from './ItemCard';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const { setBreadcrumbItems } = useBreadcrumbs();

  const { loading, error, data } = useQuery(GET_DATABASE_OF_THINGS_COLLECTIONS, {
    variables: { first: 12 }
  });

  // Set breadcrumbs for landing page
  useEffect(() => {
    const homeIcon = (
      <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className="breadcrumb-icon">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );

    setBreadcrumbItems([{ label: 'Home', icon: homeIcon }]);

    return () => {
      setBreadcrumbItems([]);
    };
  }, [setBreadcrumbItems]);

  // Load recently viewed on mount and when window regains focus
  useEffect(() => {
    const loadRecentlyViewed = () => {
      setRecentlyViewed(getRecentlyViewed());
    };

    loadRecentlyViewed();

    // Refresh when window regains focus (user returns from another page)
    window.addEventListener('focus', loadRecentlyViewed);

    return () => {
      window.removeEventListener('focus', loadRecentlyViewed);
    };
  }, []);

  const handleCollectionClick = (collectionId) => {
    navigate(`/collection/${collectionId}`);
  };

  return (
    <div className="landing-page">

      {/* Recently Viewed Section */}
      {recentlyViewed.length > 0 && (
        <section className="recently-viewed">
          <div className="section-header">
            <h2 className="section-title">Recently Viewed</h2>
          </div>

          <div className="recently-viewed-scroll">
            {recentlyViewed.slice(0, 8).map((collection, index) => (
              <ItemCard
                key={collection.id}
                item={collection}
                index={index}
                onClick={() => handleCollectionClick(collection.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Featured Collections Section */}
      <section className="featured-collections">
        <div className="section-header">
          <h2 className="section-title">Featured Collections</h2>
        </div>

        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading collections...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <i className="fas fa-exclamation-triangle"></i>
            <p>Unable to load collections. Please try again later.</p>
          </div>
        )}

        {data && data.databaseOfThingsCollections && (
          <div className="collections-grid">
            {data.databaseOfThingsCollections.map((collection, index) => (
              <ItemCard
                key={collection.id}
                item={collection}
                index={index}
                onClick={() => handleCollectionClick(collection.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default LandingPage;
