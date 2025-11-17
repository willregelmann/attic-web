import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { getRecentlyViewed } from '../utils/recentlyViewed';
import { useBreadcrumbs } from '../contexts/BreadcrumbsContext';
import { useAuth } from '../contexts/AuthContext';
import { useFilters } from '../contexts/FilterContext';
import { filterEntities } from '../utils/filterUtils';
import { EntityCardGrid } from './EntityCardGrid';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { filters } = useFilters();
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const { setBreadcrumbItems, setLoading: setBreadcrumbsLoading } = useBreadcrumbs();

  const filteredRecentlyViewed = useMemo(() => {
    return filterEntities(recentlyViewed, filters);
  }, [recentlyViewed, filters]);

  // Hide breadcrumbs on landing page
  useEffect(() => {
    setBreadcrumbItems([]);
    setBreadcrumbsLoading(false);
  }, [setBreadcrumbItems, setBreadcrumbsLoading]);

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
      {filteredRecentlyViewed.length > 0 ? (
        <section className="recently-viewed">
          <div className="section-header">
            <h2 className="section-title">Recently Viewed</h2>
          </div>

          <EntityCardGrid
            items={filteredRecentlyViewed}
            onCollectionClick={(collection) => handleCollectionClick(collection.id)}
            onItemClick={(item) => handleCollectionClick(item.id)}
            viewMode="grid"
          />
        </section>
      ) : (
        <div className="empty-landing-state">
          <h3>Search to get started</h3>
          <p>Use the search bar above to discover collections and items</p>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
