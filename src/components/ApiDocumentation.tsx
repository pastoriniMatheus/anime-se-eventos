
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Globe, Webhook, Database, MessageSquare, QrCode, Users } from 'lucide-react';

const ApiDocumentation = () => {
  const baseUrl = window.location.origin;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Documentação da API</span>
          </CardTitle>
          <CardDescription>
            Integre com nosso sistema usando os endpoints REST disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="webhooks" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="leads">Leads</TabsTrigger>
              <TabsTrigger value="messages">Mensagens</TabsTrigger>
              <TabsTrigger value="qrcodes">QR Codes</TabsTrigger>
              <TabsTrigger value="events">Eventos</TabsTrigger>
              <TabsTrigger value="auth">Auth</TabsTrigger>
            </TabsList>

            {/* Webhooks */}
            <TabsContent value="webhooks" className="space-y-4">
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">🔗 Webhook de Confirmação de Entrega</h3>
                  <p className="text-sm text-blue-700">
                    Confirma a entrega de mensagens enviadas pelo sistema
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Endpoint:</h4>
                    <div className="bg-gray-900 text-green-400 p-3 rounded mt-2 font-mono text-sm">
                      <Badge variant="outline" className="mr-2 bg-green-600 text-white">POST</Badge>
                      {baseUrl}/webhook-delivery
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium">Headers:</h4>
                    <pre className="bg-gray-100 p-3 rounded mt-2 text-sm">
{`Content-Type: application/json`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-medium">Payload:</h4>
                    <pre className="bg-gray-100 p-3 rounded mt-2 text-sm overflow-x-auto">
{JSON.stringify({
  delivery_code: "MSG-1234567890-abc123",
  lead_identifier: "email@exemplo.com",
  status: "delivered"
}, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-medium">Exemplo cURL:</h4>
                    <pre className="bg-gray-900 text-green-400 p-3 rounded mt-2 text-sm overflow-x-auto">
{`curl -X POST ${baseUrl}/webhook-delivery \\
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
            </TabsContent>

            {/* Leads */}
            <TabsContent value="leads" className="space-y-4">
              <div className="space-y-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">👥 Captura de Leads</h3>
                  <p className="text-sm text-green-700">
                    Endpoints para capturar e gerenciar leads via API
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Captura via Edge Function:</h4>
                    <div className="bg-gray-900 text-green-400 p-3 rounded mt-2 font-mono text-sm">
                      <Badge variant="outline" className="mr-2 bg-green-600 text-white">POST</Badge>
                      https://iznfrkdsmbtynmifqcdd.supabase.co/functions/v1/lead-capture
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium">Payload para Captura:</h4>
                    <pre className="bg-gray-100 p-3 rounded mt-2 text-sm overflow-x-auto">
{JSON.stringify({
  name: "Nome do Lead",
  email: "email@exemplo.com",
  whatsapp: "5511999999999",
  course_id: "uuid-do-curso",
  event_id: "uuid-do-evento",
  scan_session_id: "uuid-da-sessao"
}, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-medium">Sincronização de Leads:</h4>
                    <div className="bg-gray-900 text-green-400 p-3 rounded mt-2 font-mono text-sm">
                      <Badge variant="outline" className="mr-2 bg-blue-600 text-white">POST</Badge>
                      https://iznfrkdsmbtynmifqcdd.supabase.co/functions/v1/sync-leads
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Messages */}
            <TabsContent value="messages" className="space-y-4">
              <div className="space-y-6">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">💬 Envio de Mensagens</h3>
                  <p className="text-sm text-purple-700">
                    Sistema de envio via webhooks para WhatsApp, Email e SMS
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Webhook de Envio:</h4>
                    <div className="bg-gray-900 text-green-400 p-3 rounded mt-2 font-mono text-sm">
                      <Badge variant="outline" className="mr-2 bg-purple-600 text-white">POST</Badge>
                      https://iznfrkdsmbtynmifqcdd.supabase.co/functions/v1/send-webhook
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium">Estrutura de Resposta do Webhook:</h4>
                    <pre className="bg-gray-100 p-3 rounded mt-2 text-sm overflow-x-auto">
{JSON.stringify({
  success: true,
  message: "Messages sent successfully",
  delivery_code: "MSG-1234567890-abc123",
  recipients_count: 5,
  sent_messages: [
    {
      lead_id: "uuid",
      name: "Nome",
      email: "email@exemplo.com",
      whatsapp: "5511999999999"
    }
  ]
}, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* QR Codes */}
            <TabsContent value="qrcodes" className="space-y-4">
              <div className="space-y-6">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-2">📱 QR Codes</h3>
                  <p className="text-sm text-orange-700">
                    Sistema de redirecionamento e tracking via QR Codes
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Redirecionamento:</h4>
                    <div className="bg-gray-900 text-green-400 p-3 rounded mt-2 font-mono text-sm">
                      <Badge variant="outline" className="mr-2 bg-orange-600 text-white">GET</Badge>
                      https://iznfrkdsmbtynmifqcdd.supabase.co/functions/v1/qr-redirect?id=TRACKING_ID
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium">Parâmetros:</h4>
                    <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                      <li><strong>id:</strong> ID de tracking do QR Code</li>
                      <li><strong>Retorna:</strong> Redirecionamento HTTP 302 para URL de destino</li>
                      <li><strong>Tracking:</strong> Incrementa automaticamente contador de scans</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Events */}
            <TabsContent value="events" className="space-y-4">
              <div className="space-y-6">
                <div className="bg-teal-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-teal-800 mb-2">📅 Eventos</h3>
                  <p className="text-sm text-teal-700">
                    Geração de relatórios e dados de eventos
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Relatório de Evento:</h4>
                    <div className="bg-gray-900 text-green-400 p-3 rounded mt-2 font-mono text-sm">
                      <Badge variant="outline" className="mr-2 bg-teal-600 text-white">POST</Badge>
                      https://iznfrkdsmbtynmifqcdd.supabase.co/functions/v1/generate-event-report
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium">Payload:</h4>
                    <pre className="bg-gray-100 p-3 rounded mt-2 text-sm overflow-x-auto">
{JSON.stringify({
  event_id: "uuid-do-evento",
  format: "csv" // ou "json"
}, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Auth */}
            <TabsContent value="auth" className="space-y-4">
              <div className="space-y-6">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">🔐 Autenticação</h3>
                  <p className="text-sm text-red-700">
                    Sistema de validação e callbacks
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Validação WhatsApp:</h4>
                    <div className="bg-gray-900 text-green-400 p-3 rounded mt-2 font-mono text-sm">
                      <Badge variant="outline" className="mr-2 bg-red-600 text-white">POST</Badge>
                      https://iznfrkdsmbtynmifqcdd.supabase.co/functions/v1/validate-whatsapp
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium">Callback de Status:</h4>
                    <div className="bg-gray-900 text-green-400 p-3 rounded mt-2 font-mono text-sm">
                      <Badge variant="outline" className="mr-2 bg-red-600 text-white">POST</Badge>
                      https://iznfrkdsmbtynmifqcdd.supabase.co/functions/v1/lead-status-callback
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium">Callback WhatsApp:</h4>
                    <div className="bg-gray-900 text-green-400 p-3 rounded mt-2 font-mono text-sm">
                      <Badge variant="outline" className="mr-2 bg-red-600 text-white">POST</Badge>
                      https://iznfrkdsmbtynmifqcdd.supabase.co/functions/v1/whatsapp-validation-callback
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">🔄 Configuração Dinâmica</h4>
            <div className="space-y-2 text-sm text-yellow-700">
              <p>✅ <strong>Multi-banco:</strong> Sistema se adapta automaticamente ao banco configurado</p>
              <p>✅ <strong>Instalação via /secret-install:</strong> Funciona com qualquer instalação</p>
              <p>✅ <strong>Webhooks dinâmicos:</strong> URLs se ajustam conforme configuração atual</p>
              <p>✅ <strong>CORS habilitado:</strong> Pode ser chamado de qualquer domínio</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiDocumentation;
