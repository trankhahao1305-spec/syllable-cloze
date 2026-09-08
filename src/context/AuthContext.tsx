import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncLocalDataToCloud } from '../services/syncService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, pass: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(
          window.location.hash.startsWith('#')
            ? window.location.hash.substring(1)
            : window.location.hash
        );

        const code = searchParams.get('code') || hashParams.get('code');
        const error = searchParams.get('error') || hashParams.get('error');
        const errorDesc = searchParams.get('error_description') || hashParams.get('error_description');

        if (error) {
          console.error('[Supabase Auth Redirect Error]:', error, errorDesc);
          alert(`Đăng nhập không thành công: ${errorDesc || error}`);
        }

        if (code) {
          console.log('[Supabase Auth] Phát hiện auth code trong URL, đang đổi session...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('[Supabase Auth] Lỗi exchangeCodeForSession:', exchangeError.message);
          } else if (data.session) {
            console.log('[Supabase Auth] Đổi session thành công:', data.session.user.email);
            setSession(data.session);
            setUser(data.session.user);
            syncLocalDataToCloud(data.session.user.id);
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }

        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession) {
          setSession(existingSession);
          setUser(existingSession.user);
          syncLocalDataToCloud(existingSession.user.id);
        }
      } catch (err) {
        console.error('[Supabase Auth] Lỗi trong quá trình khởi tạo:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Lắng nghe thay đổi trạng thái đăng nhập
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Supabase Auth State]:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        syncLocalDataToCloud(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      throw new Error('Chưa cấu hình Supabase URL & Key. Vui lòng kiểm tra file .env');
    }
    const currentOrigin =
      typeof window !== 'undefined' &&
      window.location.origin &&
      window.location.origin !== 'null' &&
      !window.location.origin.startsWith('file:')
        ? window.location.origin
        : 'http://localhost:5173';

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: currentOrigin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Chưa cấu hình Supabase URL & Key. Vui lòng kiểm tra file .env' } };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { error };
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Chưa cấu hình Supabase URL & Key. Vui lòng kiểm tra file .env' } };
    }
    const { error } = await supabase.auth.signUp({ email, password: pass });
    return { error };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setSession(null);
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
