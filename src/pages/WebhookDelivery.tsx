
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">API Documentation - Webhooks</h1>
        
        <div className="space-y-8">
          {/* Webhook de Confirmação de Entrega */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">🔗 Webhook de Confirmação de Entrega</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">Endpoint:</h3>
                <code className="bg-white p-3 rounded border block mt-2 text-sm">
                  POST {window.location.origin}/webhook-delivery
                </code>
              </div>

              <div>
                <h3 className="font-medium text-lg">Headers:</h3>
                <pre className="bg-white p-3 rounded border block mt-2 text-sm">
{`Content-Type: application/json`}
                </pre>
              </div>

              <div>
                <h3 className="font-medium text-lg">Payload:</h3>
                <pre className="bg-white p-3 rounded border block mt-2 text-sm overflow-x-auto">
{JSON.stringify({
  delivery_code: "MSG-1234567890-abc123",
  lead_identifier: "email@exemplo.com", // ou número do WhatsApp
  status: "delivered" // ou "failed"
}, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-medium text-lg">Resposta de Sucesso:</h3>
                <pre className="bg-white p-3 rounded border block mt-2 text-sm">
{JSON.stringify({
  success: true,
  message: "Delivery status updated successfully",
  delivery_code: "MSG-1234567890-abc123",
  status: "delivered"
}, null, 2)}
                </pre>
              </div>

              <div className="bg-blue-50 p-4 rounded">
                <h4 className="font-medium text-blue-800 mb-2">📋 Parâmetros:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li><strong>delivery_code:</strong> Código único da mensagem (obrigatório)</li>
                  <li><strong>lead_identifier:</strong> Email ou WhatsApp do destinatário (obrigatório)</li>
                  <li><strong>status:</strong> Status da entrega - "delivered" ou "failed" (padrão: "delivered")</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Informações gerais */}
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">⚙️ Configuração Dinâmica</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <p>✅ <strong>Banco Dinâmico:</strong> O endpoint se adapta automaticamente ao banco configurado</p>
              <p>✅ <strong>Instalação Automática:</strong> Funciona com bancos instalados via /secret-install</p>
              <p>✅ <strong>Multi-domínio:</strong> Detecta automaticamente a configuração correta</p>
            </div>
          </div>

          {/* Exemplo de uso com cURL */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">💻 Exemplo de Uso (cURL)</h2>
            <pre className="bg-black text-green-400 p-4 rounded text-sm overflow-x-auto">
{`curl -X POST ${window.location.origin}/webhook-delivery \\
  -H "Content-Type: application/json" \\
  -d '{
    "delivery_code": "MSG-1234567890-abc123",
    "lead_identifier": "usuario@email.com",
    "status": "delivered"
  }'`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebhookDelivery;
