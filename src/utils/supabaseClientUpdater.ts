
import { createClient } from '@supabase/supabase-js';
import { DatabaseConfig } from '@/types/database';

// Salvar configurações no localStorage
export const saveSupabaseConfig = (config: DatabaseConfig): void => {
  if (config.type === 'supabase' && config.supabaseUrl && config.supabaseServiceKey) {
    const configToSave = {
      url: config.supabaseUrl,
      serviceKey: config.supabaseServiceKey,
      anonKey: config.supabaseAnonKey || '',
      savedAt: new Date().toISOString(),
      domain: window.location.origin
    };
    
    localStorage.setItem('supabase-config', JSON.stringify(configToSave));
    console.log('[Config] Configurações do Supabase salvas para domínio:', window.location.origin);
  }
};

// Carregar configurações do localStorage
export const loadSupabaseConfig = (): DatabaseConfig | null => {
  try {
    const saved = localStorage.getItem('supabase-config');
    if (saved) {
      const config = JSON.parse(saved);
      console.log('[Config] Configuração carregada:', {
        url: config.url,
        domain: config.domain,
        currentDomain: window.location.origin
      });
      
      return {
        type: 'supabase',
        supabaseUrl: config.url,
        supabaseServiceKey: config.serviceKey,
        supabaseAnonKey: config.anonKey
      };
    }
  } catch (error) {
    console.error('[Config] Erro ao carregar configurações:', error);
  }
  return null;
};

// Atualizar cliente Supabase atual
export const updateSupabaseClient = (config: DatabaseConfig): boolean => {
  try {
    if (config.type === 'supabase' && config.supabaseUrl && config.supabaseServiceKey) {
      // Criar novo cliente
      const newClient = createClient(config.supabaseUrl, config.supabaseServiceKey);
      
      // Salvar no window para acesso global (se necessário)
      (window as any).customSupabaseClient = newClient;
      
      console.log('[Config] Cliente Supabase atualizado para domínio:', window.location.origin);
      
      // Forçar recriação do cliente principal
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('[Config] Erro ao atualizar cliente Supabase:', error);
    return false;
  }
};

// Verificar se há configuração salva
export const hasSupabaseConfig = (): boolean => {
  return localStorage.getItem('supabase-config') !== null;
};

// Limpar configurações salvas
export const clearSupabaseConfig = (): void => {
  localStorage.removeItem('supabase-config');
  console.log('[Config] Configurações do Supabase removidas');
};

// Função para obter cliente com configuração atual
export const getCurrentSupabaseClient = () => {
  const savedConfig = loadSupabaseConfig();
  
  if (savedConfig && savedConfig.supabaseUrl && savedConfig.supabaseAnonKey) {
    console.log('[Config] Usando configuração salva:', savedConfig.supabaseUrl);
    return createClient(savedConfig.supabaseUrl, savedConfig.supabaseAnonKey);
  }
  
  // Fallback para cliente padrão baseado no domínio atual
  console.log('[Config] Usando configuração padrão para domínio:', window.location.origin);
  
  // Detectar automaticamente a configuração baseada no domínio
  if (window.location.origin.includes('lovableproject.com')) {
    // Configuração para Lovable
    const SUPABASE_URL = "https://iznfrkdsmbtynmifqcdd.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6bmZya2RzbWJ0eW5taWZxY2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzIzOTAsImV4cCI6MjA2NzMwODM5MH0.8Rqh2hxan513BDqxDSYM_sy8O-hEPlAb9OLL166BzIQ";
    
    console.log('[Config] Usando configuração Lovable');
    return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  } else {
    // Configuração alternativa para outros domínios
    const SUPABASE_URL = "https://dobtquebpcnzjisftcfh.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3UiOiJzdXBhYmFzZSIsInJlZiI6ImRvYnRxdWVicGNuemppc2Z0Y2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NzcyNTMsImV4cCI6MjA2NTE1MzI1M30.GvPd5cEdgmAZG-Jsch66mdX24QNosV12Tz-F1Af93_0";
    
    console.log('[Config] Usando configuração alternativa');
    return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  }
};
