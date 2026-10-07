/**
 * src/context/AuthContext.jsx
 * ---------------------------------------------------------
 * Holds the logged-in user (+ his shop) for the whole app.
 * Any component can read it with the `useAuth()` hook.
 */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth.api';
import { clearToken, getToken, setToken, USER_KEY } from '../api/client';
import { ROLES } from '../config/constants';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch {
      return null;
    }
  });
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  /** Refresh the session from the API (also used after a profile update). */
  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setShop(null);
      setLoading(false);
      return null;
    }

    try {
      const response = await authApi.me();
      setUser(response.data.user);
      setShop(response.data.shop || null);
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      return response.data;
    } catch {
      clearToken();
      setUser(null);
      setShop(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load the session once, and again if a 401 happens anywhere
  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setShop(null);
    };
    window.addEventListener('bm:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('bm:unauthorized', handleUnauthorized);
  }, []);

  const persistSession = (data) => {
    setToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    setShop(data.shop || null);
  };

  const login = async (credentials) => {
    const response = await authApi.login(credentials);
    persistSession(response.data);
    return response;
  };

  const register = async (payload) => {
    const response = await authApi.register(payload);
    persistSession(response.data);
    return response;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // even if the API fails we still clean the local session
    }
    clearToken();
    setUser(null);
    setShop(null);
  };

  const value = useMemo(
    () => ({
      user,
      shop,
      loading,
      isAuthenticated: Boolean(user),
      isCustomer: user?.role === ROLES.CUSTOMER,
      isSeller: user?.role === ROLES.SELLER,
      isAdmin: user?.role === ROLES.ADMIN,
      login,
      register,
      logout,
      refresh,
      setUser,
      setShop,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, shop, loading, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
