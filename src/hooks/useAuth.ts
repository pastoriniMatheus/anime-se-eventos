
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
      try {
        setUser(JSON.parse(savedUser));
        console.log('Usuário carregado do localStorage:', JSON.parse(savedUser));
      } catch (error) {
        console.error('Erro ao carregar usuário do localStorage:', error);
        localStorage.removeItem('cesmac_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      console.log('=== INÍCIO DO LOGIN ===');
      console.log('Username tentando logar:', username);
      console.log('Cliente Supabase atual:', supabase);
      
      // Teste de conectividade básica
      const { data: testData, error: testError } = await supabase
        .from('authorized_users')
        .select('username')
        .limit(1);
      
      console.log('Teste de conectividade:', { testData, testError });
      
      // Verificar se o usuário existe
      const { data: userCheck, error: userCheckError } = await supabase
        .from('authorized_users')
        .select('username, email')
        .eq('username', username);
        
      console.log('Verificação de usuário:', { userCheck, userCheckError });
      
      // Usar tipagem any para RPC functions que não estão nos tipos
      console.log('Chamando verify_login com:', { p_username: username, p_password: password });
      
      const { data, error } = await (supabase as any).rpc('verify_login', {
        p_username: username,
        p_password: password
      });

      console.log('Resposta do RPC verify_login:', { data, error });

      if (error) {
        console.error('Erro na verificação RPC:', error);
        return { success: false, error: 'Erro interno do sistema: ' + error.message };
      }

      console.log('Dados retornados pelo RPC:', data);
      console.log('Tipo dos dados:', typeof data);
      console.log('É array?', Array.isArray(data));

      if (data && Array.isArray(data) && data.length > 0) {
        console.log('Primeiro item do array:', data[0]);
        
        if (data[0].success) {
          const userData = data[0].user_data as unknown as User;
          console.log('Dados do usuário extraídos:', userData);
          
          setUser(userData);
          localStorage.setItem('cesmac_user', JSON.stringify(userData));
          console.log('=== LOGIN SUCESSO ===');
          return { success: true };
        } else {
          console.log('Login falhou - credenciais incorretas');
          return { success: false, error: 'Usuário ou senha incorretos' };
        }
      } else {
        console.log('Resposta inesperada do RPC:', data);
        return { success: false, error: 'Resposta inesperada do servidor' };
      }
    } catch (error) {
      console.error('Erro no login (catch):', error);
      return { success: false, error: 'Erro de conexão: ' + (error as Error).message };
    }
  };

  const logout = () => {
    console.log('Fazendo logout...');
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
