
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useMessageTemplates = () => {
  return useQuery({
    queryKey: ['message_templates'],
    queryFn: async () => {
      // Usar tipagem any para acessar tabelas não tipadas
      const { data, error } = await (supabase as any)
        .from('message_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useMessages = () => {
  return useQuery({
    queryKey: ['message_history'],
    queryFn: async () => {
      // Usar tipagem any para acessar tabelas não tipadas
      const { data, error } = await (supabase as any)
        .from('message_history')
        .select('*')
        .order('sent_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useMessageHistory = () => {
  return useQuery({
    queryKey: ['message_history'],
    queryFn: async () => {
      // Usar tipagem any para acessar tabelas não tipadas
      const { data, error } = await (supabase as any)
        .from('message_history')
        .select('*')
        .order('sent_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useCreateMessageTemplate = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, content, type }: { name: string; content: string; type: string }) => {
      // Usar tipagem any para acessar tabelas não tipadas
      const { data, error } = await (supabase as any)
        .from('message_templates')
        .insert([{ name, content, type }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message_templates'] });
      toast({
        title: "Template salvo",
        description: "Template salvo com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar template",
        variant: "destructive",
      });
    }
  });
};

export const useDeleteMessageTemplate = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await (supabase as any)
        .from('message_templates')
        .delete()
        .eq('id', templateId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message_templates'] });
      toast({
        title: "Template excluído",
        description: "Template excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir template",
        variant: "destructive",
      });
    }
  });
};
