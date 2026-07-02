import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { tokenStorage } from '@/api/tokenStorage';

interface AuthContextValue {
  isLoggedIn: boolean;
  loading: boolean;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tokenStorage.getAccessToken().then((token) => {
      setIsLoggedIn(!!token);
      setLoading(false);
    });
  }, []);

  async function login(accessToken: string, refreshToken: string) {
    await tokenStorage.setAccessToken(accessToken);
    await tokenStorage.setRefreshToken(refreshToken);
    setIsLoggedIn(true);
  }

  async function logout() {
    await tokenStorage.clearTokens();
    setIsLoggedIn(false);
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
