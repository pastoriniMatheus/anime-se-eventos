
import React, { useEffect, useState } from 'react';
import { handleMessageDeliveryWebhook } from '@/api/webhook-handler';

const MessageDeliveryWebhook = () => {
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Interceptar todas as requisições para esta rota
  useEffect(() => {
    const handlePostRequests = () => {
      if (typeof window !== 'undefined') {
        // Interceptar fetch global para esta rota específica
        const originalFetch = window.fetch;
        
        window.fetch = async (input, init) => {
          const requestUrl = typeof input === 'string' ? input : 
                           input instanceof URL ? input.toString() : 
                           (input as Request).url;
          
          // Se for POST para nossa rota de webhook, processar aqui
          if (requestUrl.includes('/api/message-delivery-webhook') && init?.method === 'POST') {
            try {
              console.log('🔄 Interceptando POST para webhook:', requestUrl);
              const result = await handleMessageDeliveryWebhook(new Request(requestUrl, init));
              return result;
            } catch (error) {
              console.error('❌ Erro ao processar webhook:', error);
              return new Response(
                JSON.stringify({ success: false, error: 'Internal server error' }),
                { 
                  status: 500,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            }
          }
          
          return originalFetch(input, init);
        };

        // Cleanup quando o componente for desmontado
        return () => {
          window.fetch = originalFetch;
        };
      }
    };

    handlePostRequests();
  }, []);

  // Processar requisições POST diretas (quando a página é carregada com POST)
  useEffect(() => {
    const processDirectPost = async () => {
      // Verificar se há dados POST nos parâmetros da URL (para teste)
      const urlParams = new URLSearchParams(window.location.search);
      const deliveryCode = urlParams.get('delivery_code');
      const leadIdentifier = urlParams.get('lead_identifier');
      const status = urlParams.get('status') || 'delivered';
      
      if (deliveryCode && leadIdentifier) {
        setIsProcessing(true);
        try {
          const mockRequest = new Request(window.location.href, {
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

          const result = await handleMessageDeliveryWebhook(mockRequest);
          const data = await result.json();
          setResponse(data);
        } catch (err) {
          console.error('❌ Erro ao processar webhook:', err);
          setError((err as Error).message);
        } finally {
          setIsProcessing(false);
        }
      }
    };

    processDirectPost();
  }, []);

  // Se há uma requisição sendo processada, mostrar loading
  if (isProcessing) {
    return (
      <div className="p-4">
        <h1>Processando Webhook...</h1>
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Se há erro, mostrar erro
  if (error) {
    return (
      <div className="p-4">
        <h1>Erro no Webhook</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Erro:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Se há resposta, mostrar resposta
  if (response) {
    return (
      <div className="p-4">
        <h1>Webhook Processado</h1>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p className="font-bold">Sucesso!</p>
          <pre className="mt-2 bg-gray-100 p-4 rounded text-sm">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  // Estado padrão - endpoint pronto
  return (
    <div className="p-4">
      <h1>Message Delivery Webhook</h1>
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
        <p className="font-bold">Endpoint Ativo</p>
        <p>Este endpoint está pronto para receber confirmações de entrega via POST.</p>
        <div className="mt-4">
          <p className="font-semibold">URL do Endpoint:</p>
          <code className="bg-gray-200 px-2 py-1 rounded text-sm">
            {window.location.origin}/api/message-delivery-webhook
          </code>
        </div>
        <div className="mt-4">
          <p className="font-semibold">Exemplo de Payload:</p>
          <pre className="bg-gray-200 p-2 rounded text-sm mt-2">
{`{
  "delivery_code": "MSG-123456",
  "lead_identifier": "email@exemplo.com",
  "status": "delivered"
}`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default MessageDeliveryWebhook;
