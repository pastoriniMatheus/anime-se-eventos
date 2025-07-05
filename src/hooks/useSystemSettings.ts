
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSystemSettings = () => {
  return useQuery({
    queryKey: ['system_settings'],
    queryFn: async () => {
      console.log('Buscando configurações do sistema...');
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('key');
      
      if (error) {
        console.error('Erro ao buscar configurações:', error);
        throw error;
      }
      
      console.log('Configurações carregadas:', data);
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
  });
};

export const useUpdateSystemSetting = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      console.log('Salvando configuração:', key, value);
      
      // Check if setting exists
      const { data: existing } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', key)
        .single();

      let result;
      
      if (existing) {
        // Update existing setting
        result = await supabase
          .from('system_settings')
          .update({ 
            value: typeof value === 'string' ? value : JSON.stringify(value),
            updated_at: new Date().toISOString()
          })
          .eq('key', key)
          .select()
          .single();
      } else {
        // Insert new setting
        result = await supabase
          .from('system_settings')
          .insert({ 
            key, 
            value: typeof value === 'string' ? value : JSON.stringify(value)
          })
          .select()
          .single();
      }

      if (result.error) {
        console.error('Erro ao salvar configuração:', result.error);
        throw result.error;
      }

      return result.data;
    },
    onSuccess: (data) => {
      console.log('Configuração salva com sucesso:', data);
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
      toast({
        title: "Configuração salva",
        description: "A configuração foi atualizada com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error('Erro na mutation:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar configuração",
        variant: "destructive",
      });
    }
  });
};
