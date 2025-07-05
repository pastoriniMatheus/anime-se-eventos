
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSystemSettings = () => {
  return useQuery({
    queryKey: ['system_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
      
      if (error) throw error;
      
      // Transformar os dados para um formato mais fácil de usar
      const settings: Record<string, any> = {};
      data?.forEach(setting => {
        settings[setting.key] = setting.value;
      });
      
      return settings;
    }
  });
};

export const useUpdateSystemSetting = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { data, error } = await supabase
        .from('system_settings')
        .upsert({ key, value })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
      toast({
        title: "Configuração salva",
        description: "Configuração atualizada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar configuração",
        variant: "destructive",
      });
    }
  });
};
