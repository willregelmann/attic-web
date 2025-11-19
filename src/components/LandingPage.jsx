import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { getRecentlyViewed } from '../utils/recentlyViewed';
import { useBreadcrumbs } from '../contexts/BreadcrumbsContext';
import { useAuth } from '../contexts/AuthContext';
import { useFilters } from '../contexts/FilterContext';
import { filterEntities } from '../utils/filterUtils';
import { EntityCardGrid } from './EntityCardGrid';
import { useRadialMenu } from '../contexts/RadialMenuContext';
import MobileSearch from './MobileSearch';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { filters } = useFilters();
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const { setBreadcrumbItems, setLoading: setBreadcrumbsLoading } = useBreadcrumbs();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Set RadialMenu actions for mobile
  const radialMenuActions = useMemo(() => [
    {
      id: 'search',
      icon: 'fas fa-search',
      label: 'Search',
      onClick: () => setShowMobileSearch(true)
    }
  ], []);

  useRadialMenu(radialMenuActions, [radialMenuActions]);

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
    <div className="min-h-screen">

      {/* Recently Viewed Section */}
      {filteredRecentlyViewed.length > 0 ? (
        <section className="max-w-[1400px] mx-auto mt-6 mb-4 md:mt-8">
          <div className="m-0 p-0">
            <h2 className="text-base md:text-lg font-bold text-[var(--text-primary)] m-0 mb-4 px-4 md:px-8 text-center md:text-left">
              Recently Viewed
            </h2>
          </div>

          <EntityCardGrid
            items={filteredRecentlyViewed}
            onClick={{
              collection: (collection) => handleCollectionClick(collection.id),
              item: (item) => handleCollectionClick(item.id)
            }}
            ownership={{
              owned: new Set(),
              favorites: new Set()
            }}
            multiSelect={{
              active: false,
              selected: new Set(),
              onToggle: null,
              allowCollections: false
            }}
            viewMode="grid"
          />
        </section>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
          <h3 className="text-2xl font-semibold text-[var(--text-primary)] m-0 mb-2">
            Search to get started
          </h3>
          <p className="text-base text-[var(--text-secondary)] m-0">
            Use the search bar above to discover collections and items
          </p>
        </div>
      )}

      <MobileSearch
        isOpen={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
      />
    </div>
  );
};

export default LandingPage;
