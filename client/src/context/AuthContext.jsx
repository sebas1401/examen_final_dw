import { createContext, useContext, useEffect, useState } from 'react';
import { AuthService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(AuthService.getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      AuthService.setToken(null);
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const data = await AuthService.login(credentials);
    setUser(data.usuario);
    return data;
  };

  const register = async (payload) => {
    const data = await AuthService.register(payload);
    setUser(data.usuario);
    return data;
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
