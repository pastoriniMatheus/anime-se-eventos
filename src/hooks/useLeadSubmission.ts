
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LeadData {
  name: string;
  whatsapp: string;
  email: string;
  courseId: string;
  eventId: string;
  courseType: string;
}

export const useLeadSubmission = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const submitLead = async (
    formData: LeadData,
    scanSessionId: string | null,
    qrCodeData: any
  ) => {
    setIsLoading(true);

    try {
      console.log('Enviando lead:', formData);

      const response = await supabase.functions.invoke('lead-capture', {
        body: {
          name: formData.name,
          whatsapp: formData.whatsapp,
          email: formData.email,
          eventName: qrCodeData?.event?.name || null,
          trackingId: qrCodeData?.tracking_id || null,
          courseId: formData.courseType === 'course' ? formData.courseId || null : null,
          postgraduateCourseId: formData.courseType === 'postgraduate' ? formData.courseId || null : null,
          courseType: formData.courseType
        }
      });

      if (response.error) {
        console.error('Erro na função lead-capture:', response.error);
        throw new Error(response.error.message || 'Erro ao enviar formulário');
      }

      const { data } = response;
      console.log('Lead criado com sucesso:', data);

      toast({
        title: "Sucesso!",
        description: "Cadastro realizado com sucesso!",
      });

      return data.leadId;
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao enviar formulário. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { submitLead, isLoading };
};
