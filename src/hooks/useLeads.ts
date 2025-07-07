import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useLeads = () => {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          course:courses(name),
          postgraduate_course:postgraduate_courses(name),
          event:events(name),
          status:lead_statuses(name, color)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

export const useCheckExistingLead = () => {
  return useMutation({
    mutationFn: async ({ name, whatsapp, email }: { name: string; whatsapp: string; email: string }) => {
      const cleanWhatsapp = whatsapp.replace(/\D/g, '');
      const trimmedName = name.trim();
      const nameWords = trimmedName.split(' ').filter(word => word.length > 0);
      
      console.log('[useCheckExistingLead] Verificando lead existente:', { name: trimmedName, whatsapp: cleanWhatsapp, email });
      console.log('[useCheckExistingLead] Palavras do nome:', nameWords);
      
      // Primeira busca: exact match por email ou whatsapp (mais confiável)
      const { data: exactMatch, error: exactError } = await supabase
        .from('leads')
        .select(`
          *,
          course:courses(name),
          postgraduate_course:postgraduate_courses(name),
          status:lead_statuses(name, color)
        `)
        .or(`whatsapp.eq.${cleanWhatsapp},email.ilike.${email}`)
        .limit(1)
        .maybeSingle();
      
      if (exactError) {
        console.error('[useCheckExistingLead] Erro na busca exata:', exactError);
        throw exactError;
      }
      
      if (exactMatch) {
        console.log('[useCheckExistingLead] Match exato encontrado por email/whatsapp:', exactMatch);
        return exactMatch;
      }
      
      // Segunda busca: por nome, mas apenas se tiver pelo menos 2 palavras
      if (nameWords.length >= 2) {
        // Se tem 2 ou mais palavras, busca pelo nome completo (mais preciso)
        const { data: nameMatches, error: nameError } = await supabase
          .from('leads')
          .select(`
            *,
            course:courses(name),
            postgraduate_course:postgraduate_courses(name),
            status:lead_statuses(name, color)
          `)
          .ilike('name', `%${trimmedName}%`)
          .limit(5);
        
        if (nameError) {
          console.error('[useCheckExistingLead] Erro na busca por nome:', nameError);
          throw nameError;
        }
        
        if (nameMatches && nameMatches.length > 0) {
          // Se encontrou múltiplos, verifica se algum é exato
          const exactNameMatch = nameMatches.find(lead => 
            lead.name.toLowerCase().trim() === trimmedName.toLowerCase()
          );
          
          if (exactNameMatch) {
            console.log('[useCheckExistingLead] Match exato por nome encontrado:', exactNameMatch);
            return exactNameMatch;
          }
          
          // Se não tem match exato mas tem apenas 1 resultado similar, considera
          if (nameMatches.length === 1) {
            console.log('[useCheckExistingLead] Único match similar por nome:', nameMatches[0]);
            return nameMatches[0];
          }
          
          console.log('[useCheckExistingLead] Múltiplos matches por nome, nenhum exato:', nameMatches.length);
        }
      } else if (nameWords.length === 1) {
        // Se tem apenas 1 palavra (primeiro nome), só busca se for muito específico
        const singleWord = nameWords[0];
        if (singleWord.length >= 4) { // Pelo menos 4 caracteres para evitar nomes muito comuns
          const { data: singleNameMatch, error: singleError } = await supabase
            .from('leads')
            .select(`
              *,
              course:courses(name),
              postgraduate_course:postgraduate_courses(name),
              status:lead_statuses(name, color)
            `)
            .ilike('name', `${singleWord}%`)
            .limit(2);
          
          if (singleError) {
            console.error('[useCheckExistingLead] Erro na busca por nome único:', singleError);
            throw singleError;
          }
          
          // Só retorna se encontrou exatamente 1 resultado
          if (singleNameMatch && singleNameMatch.length === 1) {
            console.log('[useCheckExistingLead] Match único por primeiro nome:', singleNameMatch[0]);
            return singleNameMatch[0];
          }
          
          console.log('[useCheckExistingLead] Múltiplos ou nenhum match por primeiro nome:', singleNameMatch?.length || 0);
        }
      }
      
      console.log('[useCheckExistingLead] Nenhum lead existente encontrado');
      return null;
    }
  });
};

export const useUpdateLeadCourse = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, courseId, courseType }: { leadId: string; courseId: string; courseType: 'course' | 'postgraduate' }) => {
      const updateData: {
        course_type: 'course' | 'postgraduate';
        updated_at: string;
        course_id?: string | null;
        postgraduate_course_id?: string | null;
      } = {
        course_type: courseType,
        updated_at: new Date().toISOString()
      };

      if (courseType === 'course') {
        updateData.course_id = courseId;
        updateData.postgraduate_course_id = null;
      } else {
        updateData.postgraduate_course_id = courseId;
        updateData.course_id = null;
      }

      const { data, error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: "Lead atualizado",
        description: "Curso de interesse atualizado com sucesso!",
      });
    }
  });
};

export const useLeadStatuses = () => {
  return useQuery({
    queryKey: ['lead_statuses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_statuses')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });
};

export const useCreateLeadStatus = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data, error } = await supabase
        .from('lead_statuses')
        .insert([{ name, color }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead_statuses'] });
      toast({
        title: "Status adicionado",
        description: "Status adicionado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar status",
        variant: "destructive",
      });
    }
  });
};
