
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Auth] Verificando usuário salvo...');
    
    try {
      const savedUser = localStorage.getItem('cesmac_user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser) as User;
        console.log('[Auth] Usuário encontrado:', parsedUser.username);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('[Auth] Erro ao carregar usuário:', error);
      localStorage.removeItem('cesmac_user');
    }
    
    setLoading(false);
    console.log('[Auth] Inicialização completa');
  }, []);

  const login = async (username: string, password: string) => {
    console.log('[Auth] Tentando login para:', username);
    
    try {
      const { data, error } = await supabase.rpc('verify_login', {
        p_username: username,
        p_password: password
      });

      console.log('[Auth] Resposta RPC:', { data, error });

      if (error) {
        console.error('[Auth] Erro RPC:', error);
        return { success: false, error: 'Erro de conexão' };
      }

      if (data && data.length > 0 && data[0].success) {
        // Safely convert Json to User type
        const userData = data[0].user_data as any;
        const user: User = {
          id: userData.id,
          username: userData.username,
          email: userData.email
        };
        
        console.log('[Auth] Login bem-sucedido:', user);
        
        setUser(user);
        localStorage.setItem('cesmac_user', JSON.stringify(user));
        return { success: true };
      } else {
        console.log('[Auth] Credenciais inválidas');
        return { success: false, error: 'Usuário ou senha incorretos' };
      }
    } catch (error) {
      console.error('[Auth] Erro no login:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  };

  const logout = () => {
    console.log('[Auth] Fazendo logout...');
    setUser(null);
    localStorage.removeItem('cesmac_user');
  };

  return {
    user,
    login,
    logout,
    loading
  };
};

export { AuthContext };
