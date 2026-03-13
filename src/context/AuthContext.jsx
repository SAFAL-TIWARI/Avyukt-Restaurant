import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('avyukt_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    }
    return null;
  });
  
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('avyukt_user') !== null;
  });

  // Remove the mount-level useEffect that was loading user

  const login = (userData) => {
    // For fake auth, we just set the user data provided
    // If it's a login and no name is provided, we can default it
    const userToSave = {
      ...userData,
      name: userData.name || userData.email.split('@')[0],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`
    };
    setUser(userToSave);
    setIsLoggedIn(true);
    localStorage.setItem('avyukt_user', JSON.stringify(userToSave));
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('avyukt_user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('avyukt_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
