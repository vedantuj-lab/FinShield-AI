import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { adminGoogleAuthProvider, auth, googleAuthProvider } from '../lib/firebase';

const TOKEN_STORAGE_KEY = 'finshield_session_token';

export interface AppUser {
  id: number;
  uid: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  preferredLanguage: string;
  retentionDays: number;
  redactSensitive: boolean;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  token: string | null;
  loginWithEmail: (email: string, password: string) => Promise<AppUser>;
  loginAdmin: (email: string, password: string) => Promise<AppUser>;
  loginAdminWithGoogle: () => Promise<AppUser>;
  bootstrapAdmin: (
    name: string,
    email: string,
    password: string,
    setupSecret: string
  ) => Promise<AppUser>;
  registerWithEmail: (
    name: string,
    email: string,
    password: string,
    language?: string
  ) => Promise<AppUser>;
  requestPasswordReset: (email: string) => Promise<{ message: string; sandboxCode?: string }>;
  confirmPasswordReset: (email: string, resetCode: string, newPassword: string) => Promise<string>;
  loginWithGoogle: () => Promise<AppUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const skipFirebaseSyncRef = useRef(false);

  const persistToken = useCallback((nextToken: string | null) => {
    setToken(nextToken);
    try {
      if (nextToken) {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
      } else {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const getActiveToken = useCallback(async (): Promise<string | null> => {
    if (token) return token;
    try {
      const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) return stored;
    } catch {
      // ignore
    }
    if (firebaseUser) {
      return await firebaseUser.getIdToken();
    }
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  }, [token, firebaseUser]);

  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const activeToken = await getActiveToken();
      const headers = new Headers(options.headers || {});
      if (activeToken) {
        headers.set('Authorization', `Bearer ${activeToken}`);
      }
      const response = await fetch(url, { credentials: 'same-origin', ...options, headers });
      if (response.status === 401) {
        persistToken(null);
        setUser(null);
      }
      if (response.status === 403) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          return new Response(
            JSON.stringify({
              error: 'Access denied (403). Your account is suspended or lacks administrator privileges.',
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      return response;
    },
    [getActiveToken, persistToken]
  );

  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (skipFirebaseSyncRef.current) {
        return;
      }
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          if (mounted) persistToken(idToken);
          const res = await fetch('/api/auth/firebase', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });
          if (res.ok && mounted) {
            const data = await res.json();
            setUser(data.user);
          } else if (mounted) {
            persistToken(null);
            setUser(null);
          }
        } catch (err) {
          console.error('Firebase session sync error:', err);
        }
        if (mounted) setLoading(false);
        return;
      }

      // Restore local fs1.* session token if present
      let storedToken: string | null = null;
      try {
        storedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      } catch {
        storedToken = null;
      }

      if (storedToken && storedToken.startsWith('fs1.')) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (res.ok && mounted) {
            const data = await res.json();
            setUser(data.user);
            persistToken(storedToken);
          } else if (mounted) {
            persistToken(null);
            setUser(null);
          }
        } catch {
          if (mounted) {
            persistToken(null);
            setUser(null);
          }
        }
      } else if (mounted) {
        setUser(null);
      }
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [persistToken]);

  const fetchAuthJson = useCallback(async (url: string, options: RequestInit): Promise<{ res: Response; data: any }> => {
    const attempt = async () => {
      const res = await fetch(url, { credentials: 'same-origin', ...options });
      const rawText = await res.text();
      return { res, rawText };
    };

    let { res, rawText } = await attempt();
    const isHtmlOrWarmup =
      res.status !== 403 &&
      (res.status === 502 ||
        res.status === 503 ||
        res.status === 504 ||
        rawText.trimStart().startsWith('<'));

    if (isHtmlOrWarmup) {
      await new Promise((r) => setTimeout(r, 900));
      ({ res, rawText } = await attempt());
    }

    if (res.status === 403 && rawText.trimStart().startsWith('<')) {
      return {
        res,
        data: {
          error: url.includes('/api/admin/')
            ? 'Access denied (403). This account does not have administrator privileges or is suspended.'
            : 'Access denied (403). Your account is suspended or lacks permission.',
        },
      };
    }

    if (rawText.trimStart().startsWith('<')) {
      throw new Error(
        'Authentication endpoint returned an HTML page instead of JSON (the preview server may have just restarted or your preview session expired). Please reload the page and try again.'
      );
    }

    let data: any = {};
    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error('Unexpected response from authentication server. Please reload and try again.');
      }
    }
    return { res, data };
  }, []);

  const loginWithEmail = async (email: string, password: string): Promise<AppUser> => {
    const { res, data } = await fetchAuthJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(data.error || 'Login failed');
    persistToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const loginAdmin = async (email: string, password: string): Promise<AppUser> => {
    const { res, data } = await fetchAuthJson('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(data.error || 'Administrator sign-in failed');
    persistToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const bootstrapAdmin = async (
    name: string,
    email: string,
    password: string,
    setupSecret: string
  ): Promise<AppUser> => {
    const { res, data } = await fetchAuthJson('/api/admin/bootstrap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, setupSecret }),
    });
    if (!res.ok) throw new Error(data.error || 'Administrator setup failed');
    persistToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const registerWithEmail = async (
    name: string,
    email: string,
    password: string,
    preferredLanguage = 'en'
  ): Promise<AppUser> => {
    const { res, data } = await fetchAuthJson('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, preferredLanguage }),
    });
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    persistToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const requestPasswordReset = async (email: string) => {
    const { res, data } = await fetchAuthJson('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error(data.error || 'Password reset request failed');
    return { message: data.message as string, sandboxCode: data.sandboxCode as string | undefined };
  };

  const confirmPasswordReset = async (
    email: string,
    resetCode: string,
    newPassword: string
  ): Promise<string> => {
    const { res, data } = await fetchAuthJson('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, resetCode, newPassword }),
    });
    if (!res.ok) throw new Error(data.error || 'Could not reset password');
    return data.message;
  };

  const loginWithGoogle = async (): Promise<AppUser> => {
    const cred = await signInWithPopup(auth, googleAuthProvider);
    const idToken = await cred.user.getIdToken();
    persistToken(idToken);
    const { res, data } = await fetchAuthJson('/api/auth/firebase', {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) {
      persistToken(null);
      throw new Error(data.error || 'Google sign-in failed');
    }
    setUser(data.user);
    return data.user;
  };

  const loginAdminWithGoogle = async (): Promise<AppUser> => {
    skipFirebaseSyncRef.current = true;
    try {
      const cred = await signInWithPopup(auth, adminGoogleAuthProvider);
      const idToken = await cred.user.getIdToken();
      const chosenEmail = cred.user.email || 'this Google account';
      const { res, data } = await fetchAuthJson('/api/admin/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        persistToken(null);
        setUser(null);
        await firebaseSignOut(auth);
        if (res.status === 403) {
          throw new Error(
            `Access denied. The Google account "${chosenEmail}" does not have administrator privileges. Select an authorized administrator account or sign in with Administrator Email and Password.`
          );
        }
        throw new Error(data.error || 'Administrator Google sign-in denied');
      }
      persistToken(data.token || idToken);
      setUser(data.user);
      return data.user;
    } catch (err) {
      persistToken(null);
      setUser(null);
      if (auth.currentUser) {
        await firebaseSignOut(auth).catch(() => {});
      }
      throw err;
    } finally {
      skipFirebaseSyncRef.current = false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    persistToken(null);
    setUser(null);
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }
  };

  const refreshUser = async () => {
    const activeToken = await getActiveToken();
    if (!activeToken) return;
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        loginWithEmail,
        loginAdmin,
        loginAdminWithGoogle,
        bootstrapAdmin,
        registerWithEmail,
        requestPasswordReset,
        confirmPasswordReset,
        loginWithGoogle,
        logout,
        refreshUser,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
