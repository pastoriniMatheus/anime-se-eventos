
import React, { useEffect } from 'react';
import { handleDeliveryWebhook } from '@/api/webhook-delivery';

const WebhookDelivery = () => {
  useEffect(() => {
    const handleRequest = async () => {
      // Capturar dados do POST se vier via form submission
      const urlParams = new URLSearchParams(window.location.search);
      const method = urlParams.get('method') || 'GET';
      
      if (method === 'POST') {
        // Se for uma requisição POST, processar os dados
        const formData = new FormData();
        
        // Exemplo de como capturar dados de um webhook
        const body = {
          delivery_code: urlParams.get('delivery_code'),
          lead_identifier: urlParams.get('lead_identifier'),
          status: urlParams.get('status') || 'delivered'
        };

        if (body.delivery_code && body.lead_identifier) {
          try {
            const request = new Request('', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });

            const response = await handleDeliveryWebhook(request);
            const result = await response.json();
            
            console.log('Resultado do webhook:', result);
          } catch (error) {
            console.error('Erro ao processar webhook:', error);
          }
        }
      }
    };

    handleRequest();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Webhook de Confirmação de Entrega</h1>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Como usar este endpoint:</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">URL do Webhook:</h3>
              <code className="bg-white p-2 rounded border block mt-1">
                {window.location.origin}/webhook-delivery
              </code>
            </div>

            <div>
              <h3 className="font-medium">Método:</h3>
              <code className="bg-white p-2 rounded border block mt-1">POST</code>
            </div>

            <div>
              <h3 className="font-medium">Exemplo de payload:</h3>
              <pre className="bg-white p-2 rounded border block mt-1 text-sm overflow-x-auto">
{JSON.stringify({
  delivery_code: "MSG-1234567890-abc123",
  lead_identifier: "email@exemplo.com",
  status: "delivered"
}, null, 2)}
              </pre>
            </div>

            <div className="text-sm text-gray-600">
              <p><strong>delivery_code:</strong> Código de entrega da mensagem</p>
              <p><strong>lead_identifier:</strong> Email ou WhatsApp do destinatário</p>
              <p><strong>status:</strong> Status da entrega ("delivered" ou "failed")</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebhookDelivery;
