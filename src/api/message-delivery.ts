
// Endpoint dinâmico para confirmação de entrega de mensagens
// Este arquivo permite que webhooks externos confirmem a entrega de mensagens
// usando a URL da aplicação em vez da URL direta do Supabase

export const confirmMessageDelivery = async (deliveryCode: string, leadIdentifier: string, status: string = 'delivered') => {
  try {
    // Usar a URL base da aplicação para criar um endpoint dinâmico
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/message-delivery-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        delivery_code: deliveryCode,
        lead_identifier: leadIdentifier,
        status: status
      })
    });

    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Erro ao confirmar entrega da mensagem:', error);
    throw error;
  }
};

// Função para obter a URL do webhook de entrega dinâmica
export const getDeliveryWebhookUrl = () => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/api/message-delivery-webhook`;
};
