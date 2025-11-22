'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { RBAC_CONFIG } from '@/lib/permissions';

const RBACContext = createContext(null);

export const RBACProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { email, roles: [] }
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Restore user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setIsAuthenticated(true);
    }
  }, []);

  // Login function
  const login = ({ email, roles }) => {
    const newUser = { email, roles };
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  // Keep your RBAC_CONFIG logic
  const hasPageAccess = (page) =>
    user?.roles?.some((role) => RBAC_CONFIG[page]?.allowedRoles?.includes(role));

  const canPerformAction = (page, action) =>
    user?.roles?.some((role) => RBAC_CONFIG[page]?.actions?.[action]?.includes(role));

  return (
    <RBACContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        hasPageAccess,
        canPerformAction,
      }}
    >
      {children}
    </RBACContext.Provider>
  );
};

export const useRBAC = () => useContext(RBACContext);
