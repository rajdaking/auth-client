import { createContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, check if we have a valid session
  useEffect(() => {
    const initAuth = async () => {
      try {
        // If token already in sessionStorage, decode it directly
        const existingToken = sessionStorage.getItem('accessToken');
        if (existingToken) {
          const decoded = jwtDecode(existingToken);
          setUser({ id: decoded.sub, email: decoded.email, role: decoded.role });
          setLoading(false);
          return;
        }

        // Otherwise try to refresh
        const { data } = await api.post('/auth/refresh');
        sessionStorage.setItem('accessToken', data.accessToken);
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    sessionStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    await api.post('/auth/logout');
    sessionStorage.removeItem('accessToken');
    setUser(null);
  };

  const setUserFromToken = (token) => {
    const decoded = jwtDecode(token);
    setUser({ id: decoded.sub, email: decoded.email, role: decoded.role });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setUserFromToken }}>
      {children}
    </AuthContext.Provider>
  );
};