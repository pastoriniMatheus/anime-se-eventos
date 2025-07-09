
import { supabase } from '@/integrations/supabase/client';

// Função para confirmar entrega de mensagem usando a Edge Function do Supabase
export const confirmMessageDelivery = async (deliveryCode: string, leadIdentifier: string, status: string = 'delivered') => {
  try {
    console.log('🔄 Confirmando entrega da mensagem:', {
      deliveryCode,
      leadIdentifier,
      status
    });

    // Chamar a Edge Function message-delivery-webhook diretamente
    const { data, error } = await supabase.functions.invoke('message-delivery-webhook', {
      body: {
        delivery_code: deliveryCode,
        lead_identifier: leadIdentifier,
        status: status
      }
    });

    if (error) {
      console.error('❌ Erro na Edge Function:', error);
      throw error;
    }

    console.log('✅ Resposta da confirmação de entrega:', data);
    return data;
    
  } catch (error) {
    console.error('💥 Erro ao confirmar entrega da mensagem:', error);
    throw error;
  }
};

// Função para obter a URL do webhook de entrega dinâmica (para uso externo)
export const getDeliveryWebhookUrl = () => {
  // Usar o domínio atual da aplicação para criar a URL dinâmica
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/api/message-delivery-webhook`;
};
