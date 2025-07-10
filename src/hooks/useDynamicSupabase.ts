
import { useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export const useDynamicSupabase = (): SupabaseClient<Database> => {
  const [client] = useState<SupabaseClient<Database>>(() => {
    // Função para obter a configuração dinamicamente
    const getSupabaseConfig = () => {
      // Verificar se existe configuração customizada no localStorage
      if (typeof window !== 'undefined') {
        const savedConfig = localStorage.getItem('supabase-config');
        if (savedConfig) {
          try {
            const config = JSON.parse(savedConfig);
            if (config.url && config.anonKey) {
              console.log('[useDynamicSupabase] Usando configuração salva:', config.url);
              return {
                url: config.url,
                anonKey: config.anonKey
              };
            }
          } catch (error) {
            console.warn('[useDynamicSupabase] Erro ao carregar configuração salva:', error);
          }
        }
      }

      // Fallback para configuração padrão
      const SUPABASE_URL = "https://iznfrkdsmbtynmifqcdd.supabase.co";
      const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6bmZya2RzbWJ0eW5taWZxY2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzIzOTAsImV4cCI6MjA2NzMwODM5MH0.8Rqh2hxan513BDqxDSYM_sy8O-hEPlAb9OLL166BzIQ";
      
      console.log('[useDynamicSupabase] Usando configuração padrão:', SUPABASE_URL);
      return {
        url: SUPABASE_URL,
        anonKey: SUPABASE_PUBLISHABLE_KEY
      };
    };

    const config = getSupabaseConfig();
    
    return createClient<Database>(config.url, config.anonKey, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  });

  return client;
}
