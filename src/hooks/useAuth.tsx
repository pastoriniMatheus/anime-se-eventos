
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
    console.log('[Auth] Iniciando verificação de usuário salvo...');
    
    try {
      // Verificar se há usuário logado no localStorage
      const savedUser = localStorage.getItem('cesmac_user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          console.log('[Auth] Usuário carregado do localStorage:', parsedUser);
          
          // Validar se os dados do usuário são válidos
          if (parsedUser && parsedUser.id && parsedUser.username && parsedUser.email) {
            setUser(parsedUser);
            console.log('[Auth] Usuário válido carregado');
          } else {
            console.log('[Auth] Dados de usuário inválidos, removendo do localStorage');
            localStorage.removeItem('cesmac_user');
          }
        } catch (error) {
          console.error('[Auth] Erro ao carregar usuário do localStorage:', error);
          localStorage.removeItem('cesmac_user');
        }
      } else {
        console.log('[Auth] Nenhum usuário salvo encontrado');
      }
    } catch (error) {
      console.error('[Auth] Erro geral na verificação de usuário:', error);
    } finally {
      setLoading(false);
      console.log('[Auth] Loading finalizado');
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      console.log('[Auth] === INÍCIO DO LOGIN ===');
      console.log('[Auth] Username:', username);
      console.log('[Auth] Supabase configurado e pronto para uso');
      
      // Teste de conectividade básica
      console.log('[Auth] Testando conectividade com authorized_users...');
      const { data: testData, error: testError } = await supabase
        .from('authorized_users')
        .select('username')
        .limit(1);
      
      console.log('[Auth] Teste de conectividade - Data:', testData);
      console.log('[Auth] Teste de conectividade - Error:', testError);
      
      if (testError) {
        console.error('[Auth] Erro na conectividade:', testError);
        return { success: false, error: 'Erro de conexão: ' + testError.message };
      }
      
      // Verificar se o usuário existe na tabela
      console.log('[Auth] Verificando se usuário existe...');
      const { data: userExists, error: userExistsError } = await supabase
        .from('authorized_users')
        .select('username, email, id')
        .eq('username', username)
        .single();
        
      console.log('[Auth] Usuário existe - Data:', userExists);
      console.log('[Auth] Usuário existe - Error:', userExistsError);
      
      if (userExistsError || !userExists) {
        console.log('[Auth] Usuário não encontrado');
        return { success: false, error: 'Usuário não encontrado' };
      }
      
      // Chamar função RPC para verificar login
      console.log('[Auth] Chamando verify_login...');
      const { data: rpcData, error: rpcError } = await supabase.rpc('verify_login', {
        p_username: username,
        p_password: password
      });

      console.log('[Auth] RPC Response - Data:', rpcData);
      console.log('[Auth] RPC Response - Error:', rpcError);

      if (rpcError) {
        console.error('[Auth] Erro na função RPC:', rpcError);
        return { success: false, error: 'Erro interno: ' + rpcError.message };
      }

      if (rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
        const result = rpcData[0];
        console.log('[Auth] Resultado da verificação:', result);
        
        if (result.success) {
          // Validar e converter o user_data para o tipo User
          const rawUserData = result.user_data;
          
          if (rawUserData && typeof rawUserData === 'object' && !Array.isArray(rawUserData)) {
            const userData = rawUserData as { id: string; username: string; email: string };
            
            if (userData.id && userData.username && userData.email) {
              console.log('[Auth] Login bem-sucedido! Dados do usuário:', userData);
              
              const validUser: User = {
                id: userData.id,
                username: userData.username,
                email: userData.email
              };
              
              setUser(validUser);
              localStorage.setItem('cesmac_user', JSON.stringify(validUser));
              
              return { success: true };
            } else {
              console.error('[Auth] Dados do usuário incompletos:', userData);
              return { success: false, error: 'Dados do usuário incompletos' };
            }
          } else {
            console.error('[Auth] Formato de dados de usuário inválido:', rawUserData);
            return { success: false, error: 'Formato de dados inválido' };
          }
        } else {
          console.log('[Auth] Credenciais incorretas');
          return { success: false, error: 'Usuário ou senha incorretos' };
        }
      } else {
        console.log('[Auth] Resposta inesperada da função RPC:', rpcData);
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
