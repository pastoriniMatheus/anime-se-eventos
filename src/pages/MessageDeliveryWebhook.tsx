
import React, { useEffect, useState } from 'react';
import { handleMessageDeliveryWebhook } from '@/api/webhook-handler';

const MessageDeliveryWebhook = () => {
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processWebhook = async () => {
      try {
        // Verificar se há dados POST
        const urlParams = new URLSearchParams(window.location.search);
        const method = urlParams.get('method') || 'GET';
        
        if (method === 'POST') {
          // Simular dados POST para teste
          const mockRequest = new Request('', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              delivery_code: urlParams.get('delivery_code'),
              lead_identifier: urlParams.get('lead_identifier'),
              status: urlParams.get('status') || 'delivered'
            })
          });

          const result = await handleMessageDeliveryWebhook(mockRequest);
          const data = await result.json();
          setResponse(data);
        }
      } catch (err) {
        setError((err as Error).message);
      }
    };

    processWebhook();
  }, []);

  // Para requisições POST reais via fetch/axios
  useEffect(() => {
    const handlePostRequests = async () => {
      if (typeof window !== 'undefined') {
        // Interceptar requisições POST para esta rota
        const originalFetch = window.fetch;
        window.fetch = async (input, init) => {
          const requestUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
          
          if (requestUrl.includes('/api/message-delivery-webhook') && init?.method === 'POST') {
            return handleMessageDeliveryWebhook(new Request(requestUrl, init));
          }
          
          return originalFetch(input, init);
        };
      }
    };

    handlePostRequests();
  }, []);

  if (error) {
    return (
      <div className="p-4">
        <h1>Erro no Webhook</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (response) {
    return (
      <div className="p-4">
        <h1>Webhook Processado</h1>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(response, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1>Message Delivery Webhook</h1>
      <p>Endpoint pronto para receber confirmações de entrega.</p>
    </div>
  );
};

export default MessageDeliveryWebhook;
