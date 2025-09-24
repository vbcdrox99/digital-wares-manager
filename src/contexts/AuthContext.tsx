import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'customer';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, userData?: { name: string; steam_id: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para buscar dados do usuário com timeout
  const fetchUserData = async (userId: string): Promise<User | null> => {
    try {
      // Implementar timeout de 10 segundos
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na busca de dados do usuário')), 10000);
      });

      const dataPromise = supabase
        .from('users')
        .select('id, email, role')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([dataPromise, timeoutPromise]);

      if (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        return null;
      }

      return data as User;
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      return null;
    }
  };

  // Verificar se é a primeira conta sendo criada
  const isFirstUser = async (): Promise<boolean> => {
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Erro ao verificar contagem de usuários:', error);
        return false;
      }

      return count === 0;
    } catch (error) {
      console.error('Erro ao verificar contagem de usuários:', error);
      return false;
    }
  };

  // Função de login
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const userData = await fetchUserData(data.user.id);
        if (userData) {
          setUser(userData);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  };

  // Função de registro
  const register = async (email: string, password: string, userData?: { name: string; steam_id: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData ? {
            name: userData.name,
            steam_id: userData.steam_id
          } : {}
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Aguardar um pouco para o trigger criar o registro na tabela users
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const userDataResult = await fetchUserData(data.user.id);
        if (userDataResult) {
          setUser(userDataResult);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Erro no registro:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  };

  // Função de logout
  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Verificar se usuário é admin
  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  // Verificar se há usuário logado ao carregar
  useEffect(() => {
    const getSession = async () => {
      try {
        // Timeout para verificação de sessão
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout na verificação de sessão')), 8000);
        });

        const sessionPromise = supabase.auth.getSession();
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (session?.user) {
          const userData = await fetchUserData(session.user.id);
          if (userData) {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Erro ao recuperar sessão:', error);
        // Em caso de timeout ou erro, definir loading como false para não travar a interface
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const userData = await fetchUserData(session.user.id);
          if (userData) {
            setUser(userData);
          }
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};