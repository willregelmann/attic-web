import { useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { GET_DATABASE_OF_THINGS_COLLECTIONS, GET_MY_FAVORITE_COLLECTIONS } from '../queries';
import { getRecentlyViewed } from '../utils/recentlyViewed';
import { useBreadcrumbs } from '../contexts/BreadcrumbsContext';
import { useAuth } from '../contexts/AuthContext';
import { useFilters } from '../contexts/FilterContext';
import { filterEntities } from '../utils/filterUtils';
import { ItemCard } from './ItemCard';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { filters } = useFilters();
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const { setBreadcrumbItems } = useBreadcrumbs();

  // Fetch starred collections for authenticated users
  const { data: favoritesData, loading: favoritesLoading } = useQuery(GET_MY_FAVORITE_COLLECTIONS, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network'
  });

  const { loading, error, data } = useQuery(GET_DATABASE_OF_THINGS_COLLECTIONS, {
    variables: { first: 12 }
  });

  // Apply filters to collections data
  const filteredCollections = useMemo(() => {
    if (!data?.databaseOfThingsCollections) return [];
    return filterEntities(data.databaseOfThingsCollections, filters);
  }, [data, filters]);

  const filteredFavorites = useMemo(() => {
    if (!favoritesData?.myFavoriteCollections) return [];
    return favoritesData.myFavoriteCollections.filter(fav =>
      filterEntities([fav.collection], filters).length > 0
    );
  }, [favoritesData, filters]);

  const filteredRecentlyViewed = useMemo(() => {
    return filterEntities(recentlyViewed, filters);
  }, [recentlyViewed, filters]);

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

      {/* Starred Collections Section */}
      {isAuthenticated && filteredFavorites.length > 0 && (
        <section className="starred-collections">
          <div className="section-header">
            <h2 className="section-title">
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--yellow-accent)' }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Starred Collections
            </h2>
          </div>

          <div className="recently-viewed-scroll">
            {filteredFavorites.slice(0, 8).map((favorite, index) => (
              <ItemCard
                key={favorite.collection.id}
                item={favorite.collection}
                index={index}
                onClick={() => handleCollectionClick(favorite.collection.id)}
                showCompletion={true}
                completionStats={favorite.stats}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed Section */}
      {filteredRecentlyViewed.length > 0 && (
        <section className="recently-viewed">
          <div className="section-header">
            <h2 className="section-title">Recently Viewed</h2>
          </div>

          <div className="recently-viewed-scroll">
            {filteredRecentlyViewed.slice(0, 8).map((collection, index) => (
              <ItemCard
                key={collection.id}
                item={collection}
                index={index}
                onClick={() => handleCollectionClick(collection.id)}
                showCompletion={true}
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

        {data && filteredCollections.length > 0 && (
          <div className="collections-grid">
            {filteredCollections.map((collection, index) => (
              <ItemCard
                key={collection.id}
                item={collection}
                index={index}
                onClick={() => handleCollectionClick(collection.id)}
                showCompletion={true}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default LandingPage;
