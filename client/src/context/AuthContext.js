import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const user = localStorage.getItem('epa_user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    setLoading(false);
  }, []);

  // Login with email/password
  const login = (email, password) => {
    // Hardcoded users for demo purposes
    const validUsers = [
      { email: 'graf.michelle@epa.gov', password: 'B1gDumbMug', name: 'Michelle Graf' },
      { email: 'stitt.brian@epa.gov', password: 'Yfhk9r76q@@12345', name: 'Brian Stitt' }
    ];

    // Check if user exists
    const user = validUsers.find(
      (user) => user.email === email && user.password === password
    );

    if (user) {
      // Store user info in localStorage (excluding password)
      const userInfo = { 
        email: user.email, 
        name: user.name,
        authMethod: 'password'
      };
      localStorage.setItem('epa_user', JSON.stringify(userInfo));
      setCurrentUser(userInfo);
      return { success: true };
    } else {
      return { success: false, error: 'Invalid email or password' };
    }
  };

  // Login with login.gov
  const loginWithLoginGov = (tokenResponse) => {
    // In a real implementation, this would validate the token with login.gov
    // For demo purposes, we'll simulate a successful login
    const userInfo = {
      email: tokenResponse.email || 'user@login.gov',
      name: tokenResponse.name || 'Login.gov User',
      authMethod: 'login.gov',
      loginGovId: tokenResponse.sub || 'demo-login-gov-id'
    };
    
    localStorage.setItem('epa_user', JSON.stringify(userInfo));
    setCurrentUser(userInfo);
    return { success: true };
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('epa_user');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    loginWithLoginGov,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
