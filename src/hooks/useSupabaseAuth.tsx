import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  adminLoading: boolean;
  adminError: string | null;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const SupabaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const { toast } = useToast();
  const checkedRoleForUserRef = useRef<string | null>(null);
  const roleCheckInFlightRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const authStorageKeyPrefix = (() => {
      try {
        const url = new URL(import.meta.env.VITE_SUPABASE_URL);
        return `sb-${url.hostname.split('.')[0]}-auth-token`;
      } catch {
        return 'sb-auth-token';
      }
    })();

    const clearStoredAuthSession = () => {
      [window.localStorage, window.sessionStorage].forEach((storage) => {
        const keysToRemove = Object.keys(storage).filter((key) => key.startsWith(authStorageKeyPrefix));
        keysToRemove.forEach((key) => storage.removeItem(key));
      });
    };

    const hasStoredAuthSession = () => {
      return [window.localStorage, window.sessionStorage].some((storage) =>
        Object.keys(storage).some((key) => key.startsWith(authStorageKeyPrefix))
      );
    };

    const resetAuthState = () => {
      setSession(null);
      setUser(null);
      setIsAdmin(false);
      setAdminLoading(false);
      setAdminError(null);
      checkedRoleForUserRef.current = null;
      roleCheckInFlightRef.current = null;
    };

    const finishRoleCheck = (userId: string) => {
      if (roleCheckInFlightRef.current === userId) {
        roleCheckInFlightRef.current = null;
      }
      if (mounted) {
        setAdminLoading(false);
      }
    };

    const checkAdminRole = async (userId: string, force = false) => {
      if (!force && checkedRoleForUserRef.current === userId) {
        setAdminError(null);
        setAdminLoading(false);
        return;
      }

      if (roleCheckInFlightRef.current === userId) {
        return;
      }

      roleCheckInFlightRef.current = userId;
      setAdminError(null);
      setAdminLoading(true);

      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error('timeout')), 5000);
      });

      try {
        const rolePromise = supabase.rpc('has_role', {
          _user_id: userId,
          _role: 'admin',
        });

        const { data, error } = await Promise.race([rolePromise, timeoutPromise]);

        if (!mounted) return;

        if (error) {
          logger.warn('⚠️ User role check failed:', error.message);
          setIsAdmin(false);
          setAdminError('Nie udało się zweryfikować roli administratora. Spróbuj odświeżyć stronę lub zalogować się ponownie.');
        } else {
          setIsAdmin(Boolean(data));
          checkedRoleForUserRef.current = userId;
          setAdminError(Boolean(data) ? null : 'To konto nie ma uprawnień administratora.');
        }
      } catch (e: any) {
        logger.error('❌ Error checking admin role:', e);
        if (!mounted) return;
        setIsAdmin(false);
        setAdminError(
          e?.message === 'timeout'
            ? 'Weryfikacja roli administratora trwa zbyt długo. Spróbuj ponownie za chwilę.'
            : 'Wystąpił błąd podczas weryfikacji roli administratora.'
        );
      } finally {
        finishRoleCheck(userId);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      logger.log('🔐 Auth event:', event, newSession?.user?.email);
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const shouldForceCheck = event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED';
        if (shouldForceCheck || checkedRoleForUserRef.current !== newSession.user.id) {
          setTimeout(() => {
            if (mounted) void checkAdminRole(newSession.user.id, shouldForceCheck);
          }, 0);
        } else {
          setAdminError(null);
          setAdminLoading(false);
        }
      } else {
        resetAuthState();
      }

      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      if (!mounted) return;
      if (existing) {
        setSession(existing);
        setUser(existing.user);
        setTimeout(() => {
          if (mounted) void checkAdminRole(existing.user.id);
        }, 0);
      } else if (hasStoredAuthSession()) {
        logger.warn('🧹 Clearing stale Supabase auth session from storage');
        clearStoredAuthSession();
        resetAuthState();
      }
      setLoading(false);
    }).catch((e) => {
      logger.error('❌ getSession error:', e);
      clearStoredAuthSession();
      resetAuthState();
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setAdminError(null);
      checkedRoleForUserRef.current = null;
      roleCheckInFlightRef.current = null;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: 'Błąd logowania', description: error.message, variant: 'destructive' });
        return { error };
      }
      toast({ title: 'Zalogowano pomyślnie', description: `Witaj ${data.user?.email}` });
      return { data, error: null };
    } catch (error: any) {
      toast({ title: 'Błąd', description: 'Nieoczekiwany błąd logowania', variant: 'destructive' });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/admin`;
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { emailRedirectTo: redirectUrl },
      });
      if (error) {
        toast({ title: 'Błąd rejestracji', description: error.message, variant: 'destructive' });
        return { error };
      }
      toast({ title: 'Rejestracja pomyślna', description: 'Sprawdź skrzynkę pocztową' });
      return { data, error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      checkedRoleForUserRef.current = null;
      roleCheckInFlightRef.current = null;
      if (error) {
        toast({ title: 'Błąd wylogowania', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Wylogowano pomyślnie', description: 'Do zobaczenia!' });
        setTimeout(() => { window.location.href = '/'; }, 800);
      }
      return { error };
    } catch (error) {
      return { error };
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isAdmin, adminLoading, adminError, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useSupabaseAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider');
  }
  return ctx;
};
