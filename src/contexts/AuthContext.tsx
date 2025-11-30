import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, role: UserRole, name?: string) => Promise<void>;
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

    // Configurar listener de mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setUserRole(null);
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          let role = session.user.user_metadata?.role || 'resident';
          
          // Buscar role da tabela users se necessário
          if (!session.user.user_metadata?.role || role === 'resident') {
            try {
              const { data: userData } = await supabase
                .from('users')
                .select('role, full_name, email')
                .eq('id', session.user.id)
                .single();
              
              if (userData?.role) {
                role = userData.role;
              }
            } catch (err) {
              console.log('⚠️ Erro ao buscar role da tabela users no listener:', err);
            }
          }

          // Normalizar role (corrigir erro de digitação "tecnician" -> "technician")
          if (role?.toLowerCase().trim() === 'tecnician') {
            console.log('🔧 Corrigindo role de "tecnician" para "technician" no listener');
            role = 'technician';
          }

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || '',
            role: role as UserRole,
            createdAt: session.user.created_at || new Date().toISOString(),
          });
          setUserRole(role as UserRole);
        }
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        let role = data.session.user.user_metadata?.role || 'resident';
        console.log('🔍 checkUser - Role do metadata:', role);
        
        // Se não há role no metadata ou é o padrão, buscar da tabela users
        if (!data.session.user.user_metadata?.role || role === 'resident') {
          console.log('🔍 Buscando role da tabela users...');
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('role, full_name, email')
              .eq('id', data.session.user.id)
              .single();
            
            if (userError) {
              console.log('⚠️ Erro ao buscar da tabela users:', userError);
            } else if (userData?.role) {
              role = userData.role;
              console.log('✅ Role encontrado na tabela users:', role);
            } else {
              console.log('⚠️ Role não encontrado na tabela users');
            }
          } catch (err) {
            console.log('⚠️ Exceção ao buscar role da tabela users:', err);
          }
        }

        // Normalizar role (corrigir erro de digitação "tecnician" -> "technician")
        if (role?.toLowerCase().trim() === 'tecnician') {
          console.log('🔧 Corrigindo role de "tecnician" para "technician"');
          role = 'technician';
        }

        console.log('✅ Role final definido:', role);
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          name: data.session.user.user_metadata?.name || '',
          role: role as UserRole,
          createdAt: data.session.user.created_at || new Date().toISOString(),
        });
        setUserRole(role as UserRole);
      }
    } catch (err) {
      console.error('❌ Erro ao verificar usuário:', err);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, role: UserRole, name?: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('📝 Criando conta com email:', email, 'role:', role);
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            name: name || email.split('@')[0],
          },
        },
      });

      if (signUpError) {
        console.error('❌ Erro de signup:', signUpError);
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('Usuário não foi criado');
      }

      // Criar registro na tabela users
      const { error: userError } = await supabase.from('users').insert([
        {
          id: authData.user.id,
          email: email,
          full_name: name || email.split('@')[0],
          role: role,
        },
      ]);

      if (userError) {
        console.error('❌ Erro ao criar registro na tabela users:', userError);
        // Não lançar erro aqui, pois o usuário já foi criado no auth
        // O registro na tabela users pode ser criado por um trigger
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
        let role = data.session.user.user_metadata?.role || 'resident';
        
        // Se não há role no metadata ou é o padrão, buscar da tabela users
        // Isso é necessário porque técnicos podem ter role apenas na tabela users
        if (!data.session.user.user_metadata?.role || role === 'resident') {
          try {
            const { data: userData } = await supabase
              .from('users')
              .select('role, full_name, email')
              .eq('id', data.session.user.id)
              .single();
            
            if (userData?.role) {
              role = userData.role;
              console.log('✅ Role encontrado na tabela users:', role);
            }
          } catch (err) {
            console.log('⚠️ Não foi possível buscar role da tabela users, usando metadata');
          }
        }

        // Normalizar role (corrigir erro de digitação "tecnician" -> "technician")
        if (role?.toLowerCase().trim() === 'tecnician') {
          console.log('🔧 Corrigindo role de "tecnician" para "technician"');
          role = 'technician';
        }

        setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          name: data.session.user.user_metadata?.name || '',
          role: role as UserRole,
          createdAt: data.session.user.created_at || new Date().toISOString(),
        });
        setUserRole(role as UserRole);
        console.log('✅ User role definido:', role);
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
      setLoading(true);
      setError(null);
      console.log('🔐 Iniciando logout...');
      
      // Verificar se há uma sessão ativa antes de tentar fazer logout
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        console.log('⚠️ Nenhuma sessão ativa encontrada, limpando estado local apenas');
        // Limpar estado local mesmo sem sessão
        setUser(null);
        setUserRole(null);
        console.log('✅ Estado local limpo');
        return;
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        // Se o erro for "Auth session missing", apenas limpar o estado local
        if (error.message?.includes('Auth session missing') || error.message?.includes('session')) {
          console.log('⚠️ Sessão já expirada, limpando estado local apenas');
          setUser(null);
          setUserRole(null);
          console.log('✅ Estado local limpo');
          return;
        }
        
        console.error('❌ Erro no logout:', error);
        throw error;
      }
      
      // Limpar estado local
      setUser(null);
      setUserRole(null);
      console.log('✅ Logout bem-sucedido');
    } catch (err) {
      // Se o erro for relacionado a sessão, apenas limpar o estado local
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('Auth session missing') || errorMessage.includes('session')) {
        console.log('⚠️ Erro de sessão durante logout, limpando estado local apenas');
        setUser(null);
        setUserRole(null);
        return;
      }
      
      const message = err instanceof Error ? err.message : 'Erro ao sair';
      console.error('🔴 Erro no logout:', message);
      setError(message);
      // Mesmo com erro, limpar o estado local
      setUser(null);
      setUserRole(null);
    } finally {
      setLoading(false);
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
