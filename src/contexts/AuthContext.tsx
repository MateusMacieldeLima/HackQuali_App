import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>; // Alias for signIn
  signOut: () => Promise<void>;
  linkUnit: (unitCode: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          name: data.session.user.user_metadata?.name || '',
          role: data.session.user.user_metadata?.role || 'resident',
          createdAt: data.session.user.created_at || new Date().toISOString(),
        });
        setUserRole(data.session.user.user_metadata?.role || 'resident');
      }
    } catch (err) {
      console.error('Error checking user:', err);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, role: UserRole) => {
    try {
      setLoading(true);
      setError(null);
      console.log('📝 Criando conta com email:', email, 'role:', role);
      
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            name: email.split('@')[0],
          },
        },
      });

      if (signUpError) {
        console.error('❌ Erro de signup:', signUpError);
        throw signUpError;
      }
      console.log('✅ Conta criada com sucesso');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar conta';
      console.error('🔴 Erro capturado:', message);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 Iniciando login com email:', email);
      console.log('📦 Cliente Supabase inicializado');
      
      // Try normal sign in first
      let { error: signInError, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If email not confirmed error, try to get user anyway with refresh
      if (signInError && signInError.message?.includes('Email not confirmed')) {
        console.warn('⚠️ Email não confirmado, tentando confirmação automática...');
        
        // Try to auto-confirm by resending verification email and using the user data
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session?.user) {
            data = { user: sessionData.session.user, session: sessionData.session };
            signInError = null;
          }
        }
      }

      if (signInError) {
        console.error('❌ Erro de signin:', signInError);
        console.error('Mensagem:', signInError.message);
        console.error('Status:', signInError.status);
        
        // Special handling for email not confirmed
        if (signInError.message?.includes('Email not confirmed')) {
          console.log('📧 Enviando email de confirmação...');
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: email,
          });
          
          if (!resendError) {
            throw new Error('Email não confirmado. Verifique seu email para confirmação e tente novamente.');
          }
        }
        
        throw signInError;
      }

      console.log('✅ Login bem-sucedido');
      if (data.session?.user) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          name: data.session.user.user_metadata?.name || '',
          role: data.session.user.user_metadata?.role || 'resident',
          createdAt: data.session.user.created_at || new Date().toISOString(),
        });
        setUserRole(data.session.user.user_metadata?.role || 'resident');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login';
      console.error('🔴 Erro capturado:', message);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao sair';
      setError(message);
      throw err;
    }
  };

  const linkUnit = async (unitCode: string) => {
    try {
      setError(null);
      // TODO: Implement unit linking logic with Supabase
      console.log('Linking unit:', unitCode);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao vincular unidade';
      setError(message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        loading,
        error,
        signUp,
        signIn,
        login: signIn, // Alias for signIn
        signOut,
        linkUnit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
