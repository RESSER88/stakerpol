import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const checkAdminRole = async (userId: string) => {
      setAdminLoading(true);
      const timeoutId = window.setTimeout(() => {
        if (!mounted) return;
        logger.warn('⏱️ Admin role check timed out, falling back');
        setIsAdmin(false);
        setAdminLoading(false);
      }, 5000);

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
        if (!mounted) return;
        if (!error && data) {
          setIsAdmin(data.role === 'admin');
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        logger.error('❌ Error checking admin role:', e);
        if (mounted) setIsAdmin(false);
      } finally {
        clearTimeout(timeoutId);
        if (mounted) setAdminLoading(false);
      }
    };

    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      logger.log('🔐 Auth event:', event, newSession?.user?.email);
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // Defer to avoid deadlocks; fire-and-forget
        setTimeout(() => {
          if (mounted) checkAdminRole(newSession.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
        setAdminLoading(false);
      }

      setLoading(false);
    });

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      if (!mounted) return;
      if (existing) {
        setSession(existing);
        setUser(existing.user);
        setTimeout(() => {
          if (mounted) checkAdminRole(existing.user.id);
        }, 0);
      }
      setLoading(false);
    }).catch((e) => {
      logger.error('❌ getSession error:', e);
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
      value={{ user, session, loading, isAdmin, adminLoading, signIn, signUp, signOut }}
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
