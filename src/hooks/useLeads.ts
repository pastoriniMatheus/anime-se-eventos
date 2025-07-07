
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
      
      // Primeira busca: exact match por email ou whatsapp COMPLETO (mais confiável)
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
        console.log('[useCheckExistingLead] Match exato encontrado por email/whatsapp completo:', exactMatch);
        return exactMatch;
      }
      
      // Segunda busca: por nome completo, mas APENAS se tiver pelo menos 2 palavras E cada palavra ter pelo menos 3 caracteres
      if (nameWords.length >= 2 && nameWords.every(word => word.length >= 3)) {
        // Busca pelo nome completo (mais preciso)
        const { data: nameMatches, error: nameError } = await supabase
          .from('leads')
          .select(`
            *,
            course:courses(name),
            postgraduate_course:postgraduate_courses(name),
            status:lead_statuses(name, color)
          `)
          .ilike('name', `%${trimmedName}%`)
          .limit(3); // Limitar a 3 resultados para evitar muitos matches
        
        if (nameError) {
          console.error('[useCheckExistingLead] Erro na busca por nome:', nameError);
          throw nameError;
        }
        
        if (nameMatches && nameMatches.length > 0) {
          // Verificar se algum é exato
          const exactNameMatch = nameMatches.find(lead => 
            lead.name.toLowerCase().trim() === trimmedName.toLowerCase()
          );
          
          if (exactNameMatch) {
            console.log('[useCheckExistingLead] Match exato por nome completo encontrado:', exactNameMatch);
            return exactNameMatch;
          }
          
          // Se não tem match exato E tem apenas 1 resultado similar, considera apenas se tiver similaridade alta
          if (nameMatches.length === 1) {
            const similarity = calculateNameSimilarity(trimmedName.toLowerCase(), nameMatches[0].name.toLowerCase());
            if (similarity > 0.8) { // 80% de similaridade
              console.log('[useCheckExistingLead] Match similar com alta similaridade:', nameMatches[0], 'Similaridade:', similarity);
              return nameMatches[0];
            }
          }
          
          console.log('[useCheckExistingLead] Nomes similares encontrados mas sem correspondência suficiente:', nameMatches.length);
        }
      } else {
        console.log('[useCheckExistingLead] Nome muito curto ou poucas palavras para busca segura:', { nameWords: nameWords.length, minLength: nameWords.every(word => word.length >= 3) });
      }
      
      console.log('[useCheckExistingLead] Nenhum lead existente encontrado');
      return null;
    }
  });
};

// Função auxiliar para calcular similaridade entre nomes
function calculateNameSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Implementação da distância de Levenshtein
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

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
