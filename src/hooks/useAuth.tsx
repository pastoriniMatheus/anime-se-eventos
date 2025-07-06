
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
    console.log('[Auth] Domínio atual:', window.location.origin);
    console.log('[Auth] Cliente Supabase URL:', supabase.supabaseUrl);
    
    // Verificar se há usuário logado no localStorage
    const savedUser = localStorage.getItem('cesmac_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        console.log('[Auth] Usuário carregado do localStorage:', parsedUser);
      } catch (error) {
        console.error('[Auth] Erro ao carregar usuário do localStorage:', error);
        localStorage.removeItem('cesmac_user');
      }
    }
    setLoading(false);
  }, [supabase]);

  const login = async (username: string, password: string) => {
    try {
      console.log('[Auth] === INÍCIO DO LOGIN ===');
      console.log('[Auth] Domínio atual:', window.location.origin);
      console.log('[Auth] Username tentando logar:', username);
      console.log('[Auth] Cliente Supabase URL:', supabase.supabaseUrl);
      
      // Teste de conectividade básica
      console.log('[Auth] Testando conectividade...');
      const { data: testData, error: testError } = await supabase
        .from('authorized_users')
        .select('username')
        .limit(1);
      
      console.log('[Auth] Teste de conectividade:', { testData, testError });
      
      if (testError) {
        console.error('[Auth] Erro na conectividade:', testError);
        return { success: false, error: 'Erro de conexão com o banco de dados: ' + testError.message };
      }
      
      // Verificar se o usuário existe
      console.log('[Auth] Verificando se usuário existe...');
      const { data: userCheck, error: userCheckError } = await supabase
        .from('authorized_users')
        .select('username, email')
        .eq('username', username);
        
      console.log('[Auth] Verificação de usuário:', { userCheck, userCheckError });
      
      if (userCheckError) {
        console.error('[Auth] Erro na verificação do usuário:', userCheckError);
        return { success: false, error: 'Erro ao verificar usuário: ' + userCheckError.message };
      }
      
      if (!userCheck || userCheck.length === 0) {
        console.log('[Auth] Usuário não encontrado');
        return { success: false, error: 'Usuário não encontrado' };
      }
      
      // Chamar função RPC para verificar login
      console.log('[Auth] Chamando verify_login com:', { p_username: username });
      
      const { data, error } = await (supabase as any).rpc('verify_login', {
        p_username: username,
        p_password: password
      });

      console.log('[Auth] Resposta do RPC verify_login:', { data, error });

      if (error) {
        console.error('[Auth] Erro na verificação RPC:', error);
        return { success: false, error: 'Erro interno do sistema: ' + error.message };
      }

      console.log('[Auth] Dados retornados pelo RPC:', data);
      console.log('[Auth] Tipo dos dados:', typeof data);
      console.log('[Auth] É array?', Array.isArray(data));

      if (data && Array.isArray(data) && data.length > 0) {
        console.log('[Auth] Primeiro item do array:', data[0]);
        
        if (data[0].success) {
          const userData = data[0].user_data as unknown as User;
          console.log('[Auth] Dados do usuário extraídos:', userData);
          
          setUser(userData);
          localStorage.setItem('cesmac_user', JSON.stringify(userData));
          console.log('[Auth] === LOGIN SUCESSO ===');
          return { success: true };
        } else {
          console.log('[Auth] Login falhou - credenciais incorretas');
          return { success: false, error: 'Usuário ou senha incorretos' };
        }
      } else {
        console.log('[Auth] Resposta inesperada do RPC:', data);
        return { success: false, error: 'Resposta inesperada do servidor' };
      }
    } catch (error) {
      console.error('[Auth] Erro no login (catch):', error);
      return { success: false, error: 'Erro de conexão: ' + (error as Error).message };
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
