
import { useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { loadSupabaseConfig } from '@/utils/supabaseClientUpdater';
import type { Database } from '@/integrations/supabase/types';

export const useDynamicSupabase = (): SupabaseClient<Database> => {
  const [client, setClient] = useState<SupabaseClient<Database>>(() => {
    // Inicializar com configuração salva ou padrão
    const savedConfig = loadSupabaseConfig();
    
    if (savedConfig && savedConfig.supabaseUrl && savedConfig.supabaseAnonKey) {
      console.log('[useDynamicSupabase] Usando configuração salva');
      return createClient<Database>(savedConfig.supabaseUrl, savedConfig.supabaseAnonKey, {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
        }
      });
    }
    
    // Fallback para configuração padrão
    console.log('[useDynamicSupabase] Usando configuração padrão');
    const SUPABASE_URL = "https://dobtquebpcnzjisftcfh.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYnRxdWVicGNuemppc2Z0Y2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NzcyNTMsImV4cCI6MjA2NTE1MzI1M30.GvPd5cEdgmAZG-Jsch66mdX24QNosV12Tz-F1Af93_0";
    
    return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  });

  useEffect(() => {
    // Escutar mudanças na configuração
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'supabase-config') {
        const savedConfig = loadSupabaseConfig();
        if (savedConfig && savedConfig.supabaseUrl && savedConfig.supabaseAnonKey) {
          console.log('[useDynamicSupabase] Atualizando cliente com nova configuração');
          const newClient = createClient<Database>(savedConfig.supabaseUrl, savedConfig.supabaseAnonKey, {
            auth: {
              storage: localStorage,
              persistSession: true,
              autoRefreshToken: true,
            }
          });
          setClient(newClient);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return client;
};
