import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { storage } from '../storage';
import type { User } from '../models';

interface AuthContextValue {
  authed: boolean;
  checking: boolean;
  user: User | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  authed: false,
  checking: true,
  user: null,
  refresh: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authed, setAuthed] = useState(false);

  const refresh = async () => {
    const token = await storage.getToken();
    const cached = await storage.getUser();
    if (!token) {
      setAuthed(false);
      setUser(null);
      return;
    }
    setUser(cached);
    setAuthed(true);
  };

  useEffect(() => {
    (async () => {
      await refresh();
      setChecking(false);
    })();
  }, []);

  const logout = async () => {
    const { userService } = await import('../services');
    await userService.logout();
    setAuthed(false);
    setUser(null);
  };

  const value = useMemo(
    () => ({ authed, checking, user, refresh, logout }),
    [authed, checking, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}