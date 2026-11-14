import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppUser, isSupabaseConfigured, mapSupabaseUser, supabase } from '../supabase';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isConfigured: isSupabaseConfigured,
});

export const useAuth = () => useContext(AuthContext);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) {
          setUser(mapSupabaseUser(data.session?.user ?? null));
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Supabase getSession error:', error);
        if (mounted) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(mapSupabaseUser(session?.user ?? null));
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isConfigured: isSupabaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
};
