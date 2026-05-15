"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  authFetch,
  clearSession,
  getStoredUser,
  getToken,
  setSession,
  type AuthUser,
} from "@/lib/auth";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser();
    if (!token || !stored) {
      setUser(null);
      setLoading(false);
      return;
    }
    setUser(stored);
    authFetch<AuthUser>("/api/auth/me")
      .then((me) => {
        setUser(me);
        setSession(token, me);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    const isLogin = pathname === "/login";
    if (!user && !isLogin) {
      router.replace("/login");
    } else if (user && isLogin) {
      router.replace("/");
    }
  }, [user, loading, pathname, router]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authFetch<{ access_token: string; user: AuthUser }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) }
      );
      setSession(data.access_token, data.user);
      setUser(data.user);
      queryClient.clear();
      router.replace("/");
    },
    [router, queryClient]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await authFetch<{ access_token: string; user: AuthUser }>(
        "/api/auth/register",
        { method: "POST", body: JSON.stringify({ name, email, password }) }
      );
      setSession(data.access_token, data.user);
      setUser(data.user);
      queryClient.clear();
      router.replace("/");
    },
    [router, queryClient]
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    queryClient.clear();
    window.location.href = "/login";
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
