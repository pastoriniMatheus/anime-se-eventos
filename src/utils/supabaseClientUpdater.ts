
import { createClient } from '@supabase/supabase-js';
import { DatabaseConfig } from '@/types/database';

// Salvar configurações no localStorage
export const saveSupabaseConfig = (config: DatabaseConfig): void => {
  if (config.type === 'supabase' && config.supabaseUrl && config.supabaseServiceKey) {
    const configToSave = {
      url: config.supabaseUrl,
      serviceKey: config.supabaseServiceKey,
      anonKey: config.supabaseAnonKey || '',
      savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('supabase-config', JSON.stringify(configToSave));
    console.log('[Config] Configurações do Supabase salvas no localStorage');
  }
};

// Carregar configurações do localStorage
export const loadSupabaseConfig = (): DatabaseConfig | null => {
  try {
    const saved = localStorage.getItem('supabase-config');
    if (saved) {
      const config = JSON.parse(saved);
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
      
      console.log('[Config] Cliente Supabase atualizado com sucesso');
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
