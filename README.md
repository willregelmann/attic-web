# Attic Frontend - Collectibles Manager

A React-based frontend for browsing and managing collectibles using GraphQL.

## Features

- 📚 Browse collections
- 🎴 View items in collections
- 🔍 Search items by name
- 🔐 Authentication support (ready for future implementation)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at http://localhost:5174/

## Requirements

- Backend API must be running on http://localhost:8888
- The GraphQL endpoint is proxied through Vite to avoid CORS issues

## Project Structure

```
src/
├── apolloClient.js         # Apollo Client configuration
├── queries.js              # GraphQL queries
├── components/
│   ├── CollectionBrowser.jsx  # Main collections view
│   ├── ItemList.jsx           # Items within a collection
│   └── *.css                  # Component styles
└── App.jsx                    # Main application component
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## GraphQL Endpoints Used

### Public Queries (No Authentication Required)
- `collections` - Get all collections
- `collectionItems` - Get items in a specific collection
- `searchItems` - Search items by name

### Future Enhancements
- User authentication
- Personal item management
- Collection completion tracking
- Favorite collections
