import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  provider: 'local' | 'google' | 'guest';
  avatar?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInAsGuest: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const guestFlag = localStorage.getItem('focusforge_guest');
    if (guestFlag === 'true') {
      setUser({ id: 'guest-' + Date.now(), provider: 'guest', name: 'Guest User' });
      setIsGuest(true);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
        setIsGuest(false);
        localStorage.removeItem('focusforge_guest');
      } else if (!localStorage.getItem('focusforge_guest')) {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  function mapSupabaseUser(supabaseUser: { id: string; email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }): AuthUser {
    const meta = supabaseUser.user_metadata || {};
    const provider = (supabaseUser.app_metadata as Record<string, unknown>)?.provider === 'google' ? 'google' : 'local';
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: (meta.full_name as string) || (meta.name as string) || (supabaseUser.email?.split('@')[0] ?? 'User'),
      provider: provider as 'local' | 'google',
      avatar: meta.avatar_url as string | undefined,
    };
  }

  async function signUp(email: string, password: string, name: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    return { error: error ? error.message : null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return { error: error ? error.message : null };
  }

  function signInAsGuest() {
    const guestId = 'guest-' + Math.random().toString(36).substring(2);
    localStorage.setItem('focusforge_guest', 'true');
    localStorage.setItem('focusforge_guest_id', guestId);
    setIsGuest(true);
    setUser({ id: guestId, provider: 'guest', name: 'Guest User' });
  }

  async function signOut() {
    if (isGuest) {
      localStorage.removeItem('focusforge_guest');
      localStorage.removeItem('focusforge_guest_id');
      localStorage.removeItem('focusforge_guest_data');
      setIsGuest(false);
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, isGuest, signUp, signIn, signInWithGoogle, signInAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
