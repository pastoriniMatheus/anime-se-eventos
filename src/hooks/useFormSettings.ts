
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useFormSettings = () => {
  return useQuery({
    queryKey: ['form_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .in('key', ['form_thank_you_message', 'form_thank_you_title', 'form_redirect_url']);
      
      if (error) throw error;
      return data;
    }
  });
};

export const useUpdateFormSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      console.log('Salvando configuração do formulário:', key, value);
      
      // Primeiro verificar se existe
      const { data: existing } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', key)
        .single();

      let result;
      
      if (existing) {
        // Atualizar
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
        // Inserir
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
        console.error('Erro ao salvar:', result.error);
        throw result.error;
      }

      return result.data;
    },
    onSuccess: (data) => {
      console.log('Configuração do formulário salva com sucesso:', data);
      queryClient.invalidateQueries({ queryKey: ['form_settings'] });
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
    },
    onError: (error) => {
      console.error('Erro na mutation do formulário:', error);
    }
  });
};
