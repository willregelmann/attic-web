# CLAUDE.md - Attic Web

This file provides guidance to Claude Code when working with the **Attic Web** React application.

## Project Overview

**Attic Web** is a standalone React frontend for managing personal collectibles (trading cards, figures, etc.). It's a complete single-page application that communicates with a GraphQL API backend.

**Tech Stack:**
- **React 19.1** - Latest React with modern hooks
- **Vite 4.5** - Fast build tool and dev server
- **Apollo Client 4.0** - GraphQL client for API communication
- **React Router 6.30** - Client-side routing
- **Lucide React** - Modern icon library
- **@react-oauth/google** - Google OAuth integration

**Architecture Pattern:**
- Standalone React SPA (no monorepo dependencies)
- Context-based state management (no Redux)
- GraphQL-first data fetching
- Component-driven UI with co-located styles
- Mobile-first responsive design

**Backend Requirements:**
This frontend requires a compatible GraphQL API that provides:
- User authentication (Sanctum bearer tokens)
- Collection and item queries (read from external "Database of Things")
- User-specific mutations (owned items, wishlists, favorites)

## Project Structure

```
attic-web/
├── src/
│   ├── components/        # React components (35 files)
│   │   ├── AddItemsModal.jsx
│   │   ├── CollectionBrowser.jsx
│   │   ├── CollectionFilterPanel.jsx
│   │   ├── CollectionView.jsx
│   │   ├── ItemList.jsx
│   │   ├── ItemDetail.jsx
│   │   ├── Navigation.jsx
│   │   ├── MyCollection.jsx
│   │   ├── CircularMenu.jsx
│   │   ├── MobileSearch.jsx
│   │   └── ...
│   ├── contexts/          # React Context providers
│   │   ├── AuthContext.jsx
│   │   ├── FilterContext.jsx
│   │   ├── CollectionFilterContext.jsx
│   │   ├── BreadcrumbsContext.jsx
│   │   └── ThemeContext.jsx
│   ├── utils/             # Utility functions
│   │   ├── collectionFilterUtils.js
│   │   ├── filterUtils.js
│   │   ├── imageUtils.js
│   │   ├── formatters.js
│   │   └── recentlyViewed.js
│   ├── apolloClient.js    # Apollo Client configuration
│   ├── queries.js         # GraphQL queries and mutations
│   ├── App.jsx            # Main app component with routing
│   ├── main.jsx           # React entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── package.json
├── vite.config.js        # Vite configuration
└── eslint.config.js      # ESLint configuration
```

## Quick Start

```bash
# Install dependencies
npm install

# Configure API endpoint (create .env.local)
cp .env.example .env.local
# Edit .env.local: set VITE_API_URL to your backend API

# Start development server
npm run dev  # Runs on http://localhost:5173
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Production server (Railway)
npm run start  # Uses 'serve' package
```

**Development Server:**
- Runs on `http://localhost:5173`
- Hot Module Replacement (HMR) enabled
- Vite polling enabled (300ms interval) for file watching
- Built-in GraphQL proxy: `/graphql` → `http://localhost:80`

## Key Files

### Core Application

**`src/main.jsx`** - Application entry point
- Mounts React app to DOM
- Wraps app with Apollo Provider

**`src/App.jsx`** - Main application component
- React Router setup with all routes
- Context providers (Auth, Theme, Filter, Breadcrumbs)
- Route definitions

**`src/apolloClient.js`** - Apollo Client configuration
- GraphQL endpoint configuration
- Authentication header injection (Bearer token)
- Cache configuration

**`src/queries.js`** - GraphQL operations (all queries and mutations)
- Database of Things queries (collections, items, search)
- User data mutations (add to collection, wishlist, favorites)
- Organized by domain (canonical data vs user data)

### Contexts (Global State)

**`AuthContext.jsx`** - User authentication state
- Login/logout functionality
- Token management (localStorage)
- Google OAuth integration
- User profile data

**`FilterContext.jsx`** - Global filtering state
- Search query state
- Filter criteria
- Active filters

**`CollectionFilterContext.jsx`** - Collection-specific filtering
- Dynamic filter fields from collection metadata
- Multi-select filter values
- Filter application logic

**`BreadcrumbsContext.jsx`** - Navigation breadcrumbs
- Current location tracking
- Breadcrumb trail state

**`ThemeContext.jsx`** - UI theme state
- Light/dark mode (if implemented)
- Theme preferences

### Major Components

**Navigation & Layout:**
- `Navigation.jsx` - Main navigation bar with auth, search, and menu
- `Breadcrumbs.jsx` - Breadcrumb navigation
- `LandingPage.jsx` - Home page
- `CircularMenu.jsx` - Circular action menu

**Collections:**
- `CollectionBrowser.jsx` - Browse all collections
- `CollectionView.jsx` - Single collection details
- `CollectionFilterPanel.jsx` - Dynamic filtering UI
- `FilterModal.jsx` - Mobile filter modal

**Items:**
- `ItemList.jsx` - Grid/list of items with filtering
- `ItemDetail.jsx` - Single item details view
- `ItemCard.jsx` - Item card component
- `AddItemsModal.jsx` - Add items to user's collection

**User Features:**
- `MyCollection.jsx` - User's owned items
- `LoginModal.jsx` - Login/register modal

**Search:**
- `MobileSearch.jsx` - Mobile-optimized search interface
- Search integrated in `Navigation.jsx`

**Legacy/Deprecated:**
- `HierarchicalSuggestions.jsx` - Curator suggestions (deprecated)
- `SuggestionReview.jsx` - Review suggestions (deprecated)

### Utilities

**`collectionFilterUtils.js`** - Collection filtering logic
- Parse filter fields from collection data
- Apply filters to item lists
- Filter value aggregation

**`filterUtils.js`** - General filtering helpers
- Filter matching logic
- Filter state management

**`imageUtils.js`** - Image handling
- Image URL formatting
- Thumbnail generation
- Fallback images

**`formatters.js`** - Data formatting
- Date formatting
- Number formatting
- Text transformations

**`recentlyViewed.js`** - Recently viewed items
- localStorage-based history
- Recent items tracking

## Data Flow

### Authentication Flow

1. User logs in via `LoginModal` or Google OAuth
2. Token stored in localStorage
3. `AuthContext` manages auth state globally
4. Apollo Client includes token in all GraphQL requests
5. Protected routes check auth state

### Data Fetching Flow

1. Component mounts and triggers Apollo query
2. Apollo Client sends GraphQL request to API (with auth token if available)
3. API processes request and returns data
4. Apollo caches response
5. Component receives data and renders

### User Actions Flow

1. User interacts with UI (e.g., "Add to My Collection")
2. Component calls Apollo mutation
3. Mutation sent to API with variables and auth token
4. API processes mutation (updates user data)
5. Apollo cache updated with new data
6. UI re-renders automatically

## GraphQL Operations

All GraphQL operations are defined in `src/queries.js`.

### Canonical Data Queries (Read-Only)

These queries fetch collectible data from the backend's canonical database:

**Collections:**
- `GET_DATABASE_OF_THINGS_COLLECTIONS` - Browse all available collections
- `GET_DATABASE_OF_THINGS_COLLECTION_ITEMS` - View items in a collection
- `GET_DATABASE_OF_THINGS_ENTITY` - Get single item details
- `GET_DATABASE_OF_THINGS_ITEM_PARENTS` - Get parent collections (hierarchy)
- `GET_DATABASE_OF_THINGS_COLLECTION_FILTER_FIELDS` - Get dynamic filter fields

**Search:**
- `SEARCH_DATABASE_OF_THINGS_ENTITIES` - Text-based keyword search
- `SEMANTIC_SEARCH_DATABASE_OF_THINGS` - AI-powered natural language search

### User Data Mutations

These mutations manage user-specific data (requires authentication):

**My Collection:**
- `ADD_ITEM_TO_MY_COLLECTION` - Mark item as owned
- `REMOVE_ITEM_FROM_MY_COLLECTION` - Remove item from collection
- `UPDATE_USER_ITEM_NOTES` - Add/update notes on owned item

**Wishlist:**
- `ADD_ITEM_TO_WISHLIST` - Add item to wishlist
- `REMOVE_ITEM_FROM_WISHLIST` - Remove from wishlist

**Favorites:**
- `FAVORITE_COLLECTION` - Favorite a collection
- `UNFAVORITE_COLLECTION` - Unfavorite a collection

**User Queries:**
- `GET_MY_COLLECTION_ITEMS` - Fetch user's owned items
- `GET_MY_WISHLIST` - Fetch user's wishlist
- `GET_MY_FAVORITE_COLLECTIONS` - Fetch favorited collections
- `GET_MY_COLLECTION_STATS` - Get collection completion stats

## Styling Approach

**CSS Organization:**
- Component-specific CSS files (e.g., `ItemList.css`, `Navigation.css`)
- Global styles in `index.css`
- CSS modules NOT used (simple className approach)

**Responsive Design:**
- Mobile-first approach
- Media queries for tablet/desktop breakpoints
- Separate mobile components where needed (e.g., `MobileSearch.jsx`)

**Icons:**
- Lucide React for modern iconography
- FontAwesome (legacy, being phased out)
- Country flags via `country-flag-icons`

## Environment Variables

Create a `.env.local` file for local development (copy from `.env.example`):

```env
# Required: GraphQL API endpoint
VITE_API_URL=http://localhost:8000

# Optional: Google OAuth client ID for social login
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

**Usage in code:**
```javascript
// API endpoint (defaults to localhost:8000 if not set)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Google OAuth (optional)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
```

**Production Deployment:**
Set these environment variables in your hosting platform:
- `VITE_API_URL` - Your production API endpoint
- `VITE_GOOGLE_CLIENT_ID` - Production OAuth credentials (if using Google login)

## Common Development Tasks

### Adding a New Component

1. Create component file in `src/components/`
2. Create corresponding CSS file if needed
3. Import and use in routing (`App.jsx`) or parent component
4. Add to exports if needed

### Adding a New GraphQL Query

1. Define query in `src/queries.js`
2. Export query constant
3. Import in component
4. Use with `useQuery` hook from Apollo Client

Example:
```javascript
import { useQuery } from '@apollo/client';
import { GET_DATABASE_OF_THINGS_COLLECTIONS } from '../queries';

function MyComponent() {
  const { loading, error, data } = useQuery(GET_DATABASE_OF_THINGS_COLLECTIONS);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* render data */}</div>;
}
```

### Adding a New Context

1. Create context file in `src/contexts/`
2. Define Context and Provider component
3. Export useContext hook
4. Wrap app or subtree in `App.jsx`

### Working with Filters

**Collection Filtering:**
- Use `CollectionFilterContext` for collection-specific filters
- `collectionFilterUtils.js` provides helper functions
- Filters are dynamic based on collection metadata

**Global Search:**
- Use `FilterContext` for search state
- Supports both keyword and semantic search
- Search bar in `Navigation.jsx`

## API Communication

**GraphQL Endpoint:**
- Configured via `VITE_API_URL` environment variable
- Defaults to `http://localhost:8000/graphql` if not set
- Apollo Client automatically appends `/graphql` to the base URL

**Authentication:**
- Uses bearer token authentication (Laravel Sanctum)
- Token stored in `localStorage` with key `'token'`
- Apollo Client automatically includes token in headers
- Token lifecycle: set on login, removed on logout

**Error Handling:**
- Apollo Client provides `error` object with:
  - `networkError` - Connection/HTTP issues
  - `graphQLErrors` - API/query errors
- Components should display user-friendly error messages
- Check Network tab in browser DevTools for debugging

## Build and Deployment

**Development:**
```bash
npm run dev  # Starts Vite dev server on port 5173
```

**Production Build:**
```bash
npm run build     # Builds to dist/
npm run preview   # Preview production build locally
```

**Deployment:**

This is a standard Vite/React SPA that can be deployed anywhere:

1. **Static Hosting** (Vercel, Netlify, etc.):
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Set environment variables in hosting dashboard

2. **Node.js Hosting** (Railway, Heroku, etc.):
   - Build command: `npm run build`
   - Start command: `npm run start` (uses `serve` package)
   - Serves from `dist/` directory
   - Set `PORT` environment variable if needed

3. **Environment Variables Required:**
   - `VITE_API_URL` - Your production API endpoint
   - `VITE_GOOGLE_CLIENT_ID` - (Optional) Google OAuth credentials

## Important Conventions

### File Naming
- Components: PascalCase (e.g., `ItemList.jsx`)
- Utilities: camelCase (e.g., `filterUtils.js`)
- Contexts: PascalCase with "Context" suffix (e.g., `AuthContext.jsx`)

### Component Structure
- Functional components with hooks (no class components)
- Props destructuring in function signature
- PropTypes NOT used (TypeScript types in JSDoc if needed)

### State Management
- Use Context for global state (auth, theme, filters)
- Use component state for local UI state
- Use Apollo Client cache for server data

### Code Style
- ESLint configuration in `eslint.config.js`
- Run `npm run lint` before commits
- Prettier NOT configured (rely on ESLint)

## Testing

**Current State:**
- No test suite currently implemented
- Manual testing in development

**To Add Testing:**
```bash
# Install testing libraries
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest

# Add test script to package.json
# "test": "vitest"
```

## Known Issues & Technical Debt

1. **Legacy Components:**
   - `HierarchicalSuggestions.jsx` - Curator system removed, component unused
   - `SuggestionReview.jsx` - Curator system removed, component unused
   - Should be deleted

2. **Deprecated Components:**
   - Files marked for removal in git status (check with `git status`)

3. **FontAwesome:**
   - Legacy icon library, migrating to Lucide React
   - Remove once all icons migrated

4. **Testing:**
   - No automated tests currently
   - Should add unit tests for utils
   - Should add integration tests for key user flows

5. **TypeScript:**
   - Project uses JavaScript
   - Consider migrating to TypeScript for better type safety

## Troubleshooting

**GraphQL Connection Issues:**
- Verify API endpoint in `.env.local` matches your backend URL
- Check API is running and accessible
- Check browser Network tab for failed requests
- Verify CORS is configured correctly on backend

**Authentication Issues:**
- Check token exists: `localStorage.getItem('token')`
- Token may be expired - try logging out and back in
- Clear localStorage: `localStorage.clear()`
- Verify API accepts bearer token authentication

**Hot Module Replacement (HMR) Not Working:**
- Vite uses polling for file watching (300ms interval)
- Check `vite.config.js` polling settings
- Try restarting dev server: `npm run dev`

**Styling Issues:**
- Verify CSS file is imported in component
- Check class names match CSS selectors
- Inspect element in browser DevTools
- Check for CSS specificity conflicts

**Build Issues:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check for missing dependencies: `npm install`

## Related Projects (Optional Context)

This frontend is designed to work with the **Attic API** backend (a Laravel GraphQL API). While this project can work with any compatible GraphQL API, it was built as part of a larger system.

**Full Stack Setup (Optional):**
- This project can be part of a monorepo with `attic-api` (Laravel backend)
- Parent documentation: `/home/will/Projects/wills-attic/CLAUDE.md`
- Docker Compose setup available for full-stack local development

**Backend API:**
- Laravel backend with Lighthouse GraphQL
- Provides queries for collections, items, search
- Handles user authentication and user-specific data
- Source code in sibling `attic-api/` directory (if using monorepo setup)

**This frontend is fully functional as a standalone project** - you only need a compatible GraphQL API endpoint configured via `VITE_API_URL`.
