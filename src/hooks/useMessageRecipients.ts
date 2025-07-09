
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useMessageRecipients = (messageHistoryId?: string) => {
  return useQuery({
    queryKey: ['message_recipients', messageHistoryId],
    queryFn: async () => {
      if (!messageHistoryId) return [];
      
      const { data, error } = await (supabase as any)
        .from('message_recipients')
        .select(`
          *,
          leads:lead_id (
            id,
            name,
            email,
            whatsapp
          )
        `)
        .eq('message_history_id', messageHistoryId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!messageHistoryId
  });
};

export const useMessageMetrics = () => {
  return useQuery({
    queryKey: ['message_metrics'],
    queryFn: async () => {
      // Buscar métricas gerais
      const { data: totalMessages, error: totalError } = await (supabase as any)
        .from('message_history')
        .select('id')
        .eq('status', 'sent');

      if (totalError) throw totalError;

      // Buscar destinatários por status
      const { data: recipientsStats, error: recipientsError } = await (supabase as any)
        .from('message_recipients')
        .select('delivery_status');

      if (recipientsError) throw recipientsError;

      // Calcular estatísticas
      const stats = recipientsStats?.reduce((acc: any, recipient: any) => {
        acc[recipient.delivery_status] = (acc[recipient.delivery_status] || 0) + 1;
        return acc;
      }, {}) || {};

      return {
        totalMessages: totalMessages?.length || 0,
        totalRecipients: recipientsStats?.length || 0,
        pending: stats.pending || 0,
        sent: stats.sent || 0,
        delivered: stats.delivered || 0,
        failed: stats.failed || 0,
        deliveryRate: recipientsStats?.length > 0 
          ? Math.round(((stats.delivered || 0) / recipientsStats.length) * 100) 
          : 0
      };
    }
  });
};

export const useClearMessageHistory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Deletar recipients primeiro devido à foreign key
      const { error: recipientsError } = await (supabase as any)
        .from('message_recipients')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (recipientsError) throw recipientsError;

      // Deletar histórico
      const { error: historyError } = await (supabase as any)
        .from('message_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (historyError) throw historyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message_history'] });
      queryClient.invalidateQueries({ queryKey: ['message_recipients'] });
      queryClient.invalidateQueries({ queryKey: ['message_metrics'] });
      toast({
        title: "Histórico limpo",
        description: "Todo o histórico de mensagens foi removido com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao limpar histórico",
        variant: "destructive",
      });
    }
  });
};
