import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoaded(true); return; }
    api.get('/auth/me').then(r => setUser(r.data.user)).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout, loaded }}>{children}</AuthContext.Provider>;
}
