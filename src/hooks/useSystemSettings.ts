
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDynamicSupabase } from './useDynamicSupabase';

export const useSystemSettings = () => {
  const supabase = useDynamicSupabase();
  
  return useQuery({
    queryKey: ['system_settings'],
    queryFn: async () => {
      console.log('Carregando configurações do sistema...');
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
      
      if (error) {
        console.error('Erro ao carregar configurações:', error);
        throw error;
      }
      
      console.log('Configurações carregadas:', data);
      return data;
    }
  });
};

export const useUpdateSystemSetting = () => {
  const queryClient = useQueryClient();
  const supabase = useDynamicSupabase();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      console.log('Salvando configuração:', key, value);
      
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
      console.log('Configuração salva com sucesso:', data);
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
    },
    onError: (error) => {
      console.error('Erro na mutation:', error);
    }
  });
};
