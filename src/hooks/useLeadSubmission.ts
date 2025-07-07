
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
    // Prevenir múltiplas submissões simultâneas
    if (isLoading) {
      console.log('[useLeadSubmission] Já está enviando um lead, ignorando nova tentativa');
      return null;
    }

    setIsLoading(true);

    try {
      console.log('[useLeadSubmission] Enviando lead:', {
        ...formData,
        scanSessionId,
        qrCodeData: qrCodeData ? { id: qrCodeData.id, event: qrCodeData.event?.name } : null
      });

      // Preparar dados para envio
      const leadSubmissionData = {
        name: formData.name,
        whatsapp: formData.whatsapp,
        email: formData.email,
        eventName: qrCodeData?.event?.name || null,
        trackingId: qrCodeData?.tracking_id || null,
        courseId: formData.courseType === 'course' ? formData.courseId || null : null,
        postgraduateCourseId: formData.courseType === 'postgraduate' ? formData.courseId || null : null,
        courseType: formData.courseType,
        scanSessionId: scanSessionId
      };

      console.log('[useLeadSubmission] Dados preparados:', leadSubmissionData);

      const response = await supabase.functions.invoke('lead-capture', {
        body: leadSubmissionData
      });

      console.log('[useLeadSubmission] Resposta da função:', response);

      if (response.error) {
        console.error('[useLeadSubmission] Erro na função lead-capture:', response.error);
        throw new Error(response.error.message || 'Erro ao enviar formulário');
      }

      const { data } = response;
      
      if (!data || !data.success) {
        console.error('[useLeadSubmission] Resposta sem sucesso:', data);
        throw new Error(data?.error || 'Erro ao processar formulário');
      }

      console.log('[useLeadSubmission] Lead criado com sucesso:', data.leadId);

      toast({
        title: "Sucesso!",
        description: "Cadastro realizado com sucesso!",
      });

      return data.leadId;
    } catch (error) {
      console.error('[useLeadSubmission] Erro ao enviar formulário:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar formulário. Tente novamente.';
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { submitLead, isLoading };
};
