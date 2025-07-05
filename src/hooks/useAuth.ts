
import { useState, useEffect, createContext, useContext } from 'react';
import { useDynamicSupabase } from './useDynamicSupabase';

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
  const supabase = useDynamicSupabase();

  useEffect(() => {
    // Verificar se há usuário logado no localStorage
    const savedUser = localStorage.getItem('cesmac_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      console.log('Tentando fazer login:', username);
      console.log('Cliente Supabase atual:', supabase);
      
      const { data, error } = await supabase
        .rpc('verify_login', {
          p_username: username,
          p_password: password
        });

      if (error) {
        console.error('Erro na verificação:', error);
        return { success: false, error: 'Erro interno do sistema' };
      }

      if (data && data.length > 0 && data[0].success) {
        const userData = data[0].user_data as unknown as User;
        setUser(userData);
        localStorage.setItem('cesmac_user', JSON.stringify(userData));
        return { success: true };
      } else {
        return { success: false, error: 'Usuário ou senha incorretos' };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  };

  const logout = () => {
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
