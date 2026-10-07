import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useAuth() -> { user, shop, isAuthenticated, isSeller, isAdmin, login, ... }
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
};
