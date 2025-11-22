'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RBAC_CONFIG } from '@/lib/permissions';
import { authService } from '@/services/authService';

const RBACContext = createContext(null);

export const RBACProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { email, roles: [], ...backendData }
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user from token on startup
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          const userData = await authService.getMe(accessToken);
          // Map backend 'role' string to 'roles' array for your RBAC logic
          setUser({ ...userData, roles: [userData.role] });
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Session expired or invalid:', error);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      // 1. Get Tokens
      const tokens = await authService.login(email, password);
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);

      // 2. Fetch User Details
      const userData = await authService.getMe(tokens.access);
      
      // 3. Update State
      setUser({ ...userData, roles: [userData.role] });
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/login');
  };

  const hasPageAccess = (page) =>
    user?.roles?.some((role) => RBAC_CONFIG[page]?.allowedRoles?.includes(role));

  const canPerformAction = (page, action) =>
    user?.roles?.some((role) => RBAC_CONFIG[page]?.actions?.[action]?.includes(role));

  return (
    <RBACContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        hasPageAccess,
        canPerformAction,
      }}
    >
      {!loading && children}
    </RBACContext.Provider>
  );
};

export const useRBAC = () => useContext(RBACContext);