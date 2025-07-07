
import { useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export const useDynamicSupabase = (): SupabaseClient<Database> => {
  const [client] = useState<SupabaseClient<Database>>(() => {
    // Usar sempre a configuração principal do Lovable
    const SUPABASE_URL = "https://iznfrkdsmbtynmifqcdd.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6bmZya2RzbWJ0eW5taWZxY2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzIzOTAsImV4cCI6MjA2NzMwODM5MH0.8Rqh2hxan513BDqxDSYM_sy8O-hEPlAb9OLL166BzIQ";
    
    console.log('[useDynamicSupabase] Usando configuração padrão:', SUPABASE_URL);
    
    return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  });

  return client;
}
