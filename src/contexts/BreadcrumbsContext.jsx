import { createContext, useContext, useState } from 'react';

const BreadcrumbsContext = createContext();

export function BreadcrumbsProvider({ children }) {
  const [breadcrumbItems, setBreadcrumbItems] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <BreadcrumbsContext.Provider value={{ breadcrumbItems, setBreadcrumbItems, loading, setLoading }}>
      {children}
    </BreadcrumbsContext.Provider>
  );
}

export function useBreadcrumbs() {
  const context = useContext(BreadcrumbsContext);
  if (!context) {
    throw new Error('useBreadcrumbs must be used within a BreadcrumbsProvider');
  }
  return context;
}
