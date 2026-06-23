import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tokenStorage } from '@/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeJwt(token: string): { exp?: number } | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function checkAuth() {
    try {
      const token = await tokenStorage.getAccessToken();

      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const payload = decodeJwt(token);

      if (payload && typeof payload.exp === 'number' && payload.exp * 1000 > Date.now()) {
        setIsAuthenticated(true);
      } else {
        await tokenStorage.clearTokens();
        setIsAuthenticated(false);
      }
    } catch {
      await tokenStorage.clearTokens();
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuth();
  }, []);

  const login = useCallback(async (accessToken: string, refreshToken: string) => {
    await tokenStorage.setAccessToken(accessToken);
    if (refreshToken) {
      await tokenStorage.setRefreshToken(refreshToken);
    }
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await tokenStorage.clearTokens();
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
