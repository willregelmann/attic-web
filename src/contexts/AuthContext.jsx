import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useMutation, useApolloClient } from '@apollo/client';
import { GOOGLE_LOGIN } from '../queries';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleLoginMutation] = useMutation(GOOGLE_LOGIN);
  const apolloClient = useApolloClient();

  useEffect(() => {
    // Check for stored user on mount
    const storedToken = localStorage.getItem('token'); // Laravel token
    const storedUser = localStorage.getItem('user_data');

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error loading user data:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (credential) => {
    try {
      // Decode the JWT token from Google
      const decodedToken = jwtDecode(credential);

      const googleUserData = {
        id: decodedToken.sub,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        given_name: decodedToken.given_name,
        family_name: decodedToken.family_name,
      };

      // Authenticate with our backend
      const { data } = await googleLoginMutation({
        variables: {
          googleToken: credential
        }
      });

      if (data?.googleLogin) {
        const { access_token, user: backendUser } = data.googleLogin;

        // Store the Laravel token for API requests
        localStorage.setItem('token', access_token);

        // Merge user data from backend with Google profile info
        const userData = {
          ...googleUserData,
          id: backendUser.id, // Use backend user ID
          name: backendUser.name,
          email: backendUser.email,
        };

        localStorage.setItem('user_data', JSON.stringify(userData));
        setUser(userData);

        // Clear Apollo cache to ensure fresh data is fetched for the new user
        await apolloClient.resetStore();

        return userData;
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    setUser(null);

    // Clear Apollo cache to remove any cached user data
    await apolloClient.clearStore();
  };

  const isAuthenticated = !!user;

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}