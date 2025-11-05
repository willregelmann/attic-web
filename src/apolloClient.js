import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { ApolloLink } from '@apollo/client';

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );
  if (networkError) console.error(`[Network error]: ${networkError}`);
});

// HTTP connection to the API
const httpLink = createHttpLink({
  uri: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/graphql` : '/graphql',
  credentials: 'include',
});

// Auth link
const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem('token');

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }));

  return forward(operation);
});

// Configure cache with proper type policies
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Canonical data queries - cache by ID
        databaseOfThingsCollections: {
          keyArgs: false,
          merge(existing, incoming) {
            return incoming;
          },
        },
        databaseOfThingsCollectionItems: {
          keyArgs: ['collection_id'],
          merge(existing, incoming) {
            return incoming;
          },
        },
        databaseOfThingsEntity: {
          keyArgs: ['id'],
        },
        // Search results - don't cache (query-dependent)
        databaseOfThingsSearch: {
          keyArgs: ['query', 'type'],
          merge(existing, incoming) {
            return incoming;
          },
        },
        databaseOfThingsSemanticSearch: {
          keyArgs: ['query', 'type'],
          merge(existing, incoming) {
            return incoming;
          },
        },
        // User-specific data - cache but refetch on auth change
        myCollectionItems: {
          keyArgs: false,
          merge(existing, incoming) {
            return incoming;
          },
        },
        myWishlist: {
          keyArgs: false,
          merge(existing, incoming) {
            return incoming;
          },
        },
        myFavoriteCollections: {
          keyArgs: false,
          merge(existing, incoming) {
            return incoming;
          },
        },
      },
    },
  },
});

// Create the apollo client
const client = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      // Use cache-first for better performance
      // Override with cache-and-network for user data that might change frequently:
      // - myCollectionItems, myWishlist, myFavoriteCollections
      // Override with network-only only if absolutely necessary (e.g., real-time data)
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    query: {
      // Canonical data (collections, items) benefits from caching
      // This reduces API load by 50-80% for typical browsing
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default client;