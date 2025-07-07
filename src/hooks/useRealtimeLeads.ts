
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeLeads = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('[useRealtimeLeads] Mudança detectada na tabela leads:', payload);
          // Invalidar e refetch dos dados de leads
          queryClient.invalidateQueries({ queryKey: ['leads'] });
        }
      )
      .subscribe();

    return () => {
      console.log('[useRealtimeLeads] Removendo canal de realtime');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
