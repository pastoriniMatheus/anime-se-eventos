
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Globe, Webhook, Database, MessageSquare, QrCode, Users, FileText, Send } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface WebhookUrls {
  whatsapp?: string;
  email?: string;
  whatsappValidation?: string;
  sync?: string;
}

const APIsSettings = () => {
  const { data: systemSettings = [] } = useSystemSettings();
  
  const webhookSettings = systemSettings.find(s => s.key === 'webhook_urls');
  let webhookUrls: WebhookUrls = {};
  
  if (webhookSettings?.value) {
    try {
      webhookUrls = JSON.parse(webhookSettings.value);
    } catch (e) {
      console.error('Erro ao processar URLs dos webhooks:', e);
    }
  }

  const supabaseUrl = "https://iznfrkdsmbtynmifqcdd.supabase.co";
  const currentDomain = window.location.origin;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>APIs e Endpoints do Sistema</span>
          </CardTitle>
          <CardDescription>
            Documentação completa de todas as APIs e webhooks disponíveis no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Seção de Webhooks */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Webhook className="h-5 w-5" />
              <span>Webhooks Configurados</span>
            </h3>
            <div className="grid gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </h4>
                  <Badge variant="outline">POST</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Webhook para envio de mensagens WhatsApp
                </p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  {webhookUrls.whatsapp || 'Não configurado'}
                </code>
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">Payload esperado:</p>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
{`{
  "phone": "5582999999999",
  "message": "Sua mensagem aqui",
  "lead_id": "uuid-do-lead",
  "tracking_id": "codigo-rastreamento"
}`}
                  </pre>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center space-x-2">
                    <Send className="h-4 w-4" />
                    <span>Email</span>
                  </h4>
                  <Badge variant="outline">POST</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Webhook para envio de emails
                </p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  {webhookUrls.email || 'Não configurado'}
                </code>
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">Payload esperado:</p>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
{`{
  "email": "lead@exemplo.com",
  "subject": "Assunto do email",
  "message": "Conteúdo da mensagem",
  "lead_id": "uuid-do-lead"
}`}
                  </pre>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">WhatsApp Validation</h4>
                  <Badge variant="outline">POST</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Webhook para validação de números WhatsApp
                </p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  {webhookUrls.whatsappValidation || 'Não configurado'}
                </code>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Sync</h4>
                  <Badge variant="outline">POST</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Webhook para sincronização de dados
                </p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  {webhookUrls.sync || 'Não configurado'}
                </code>
              </div>
            </div>
          </div>

          <Separator />

          {/* Seção de Edge Functions */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Edge Functions (Supabase)</span>
            </h3>
            <div className="grid gap-4">
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">QR Redirect</h4>
                  <Badge variant="secondary">GET</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Redireciona QR codes para WhatsApp ou formulários
                </p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  {supabaseUrl}/functions/v1/qr-redirect/[short_url]
                </code>
                <div className="mt-2">
                  <p className="text-sm font-medium">Uso:</p>
                  <p className="text-xs text-gray-600">
                    Substitua [short_url] pelo código curto do QR code
                  </p>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Lead Capture</h4>
                  <Badge variant="secondary">POST</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Captura novos leads do formulário
                </p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  {supabaseUrl}/functions/v1/lead-capture
                </code>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Send Webhook</h4>
                  <Badge variant="secondary">POST</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Envia mensagens via webhooks configurados
                </p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  {supabaseUrl}/functions/v1/send-webhook
                </code>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Validate WhatsApp</h4>
                  <Badge variant="secondary">POST</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Valida números de WhatsApp
                </p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  {supabaseUrl}/functions/v1/validate-whatsapp
                </code>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Generate Event Report</h4>
                  <Badge variant="secondary">POST</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Gera relatórios de eventos
                </p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  {supabaseUrl}/functions/v1/generate-event-report
                </code>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Database Export/Import</h4>
                  <Badge variant="secondary">POST</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Exporta e importa dados do banco
                </p>
                <code className="text-xs bg-gray-100 p-2 rounded block mb-1">
                  {supabaseUrl}/functions/v1/database-export
                </code>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  {supabaseUrl}/functions/v1/database-import
                </code>
              </div>
            </div>
          </div>

          <Separator />

          {/* Seção de URLs do Sistema */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>URLs do Sistema</span>
            </h3>
            <div className="grid gap-4">
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Formulário de Captura</span>
                  </h4>
                  <Badge variant="outline">GET</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  URL pública para captura de leads
                </p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  {currentDomain}/form?event=[NOME_EVENTO]&tracking=[ID_RASTREAMENTO]
                </code>
                <div className="mt-2">
                  <p className="text-sm font-medium">Parâmetros:</p>
                  <ul className="text-xs text-gray-600 list-disc list-inside">
                    <li>event: Nome do evento (obrigatório)</li>
                    <li>tracking: ID de rastreamento (opcional)</li>
                  </ul>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center space-x-2">
                    <QrCode className="h-4 w-4" />
                    <span>QR Code Redirect</span>
                  </h4>
                  <Badge variant="outline">GET</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  URL de redirecionamento para QR codes
                </p>
                <code className="text-xs bg-gray-100 p-2 rounded block">
                  {supabaseUrl}/functions/v1/qr-redirect/[SHORT_CODE]
                </code>
              </div>
            </div>
          </div>

          <Separator />

          {/* Seção de Autenticação */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Autenticação</span>
            </h3>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">
                O sistema utiliza autenticação customizada baseada em usuários autorizados.
                Para acessar endpoints protegidos, é necessário estar logado no sistema.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> As Edge Functions utilizam Row Level Security (RLS) 
                  e autenticação via Supabase. URLs públicas como formulários não requerem autenticação.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Seção de Exemplos de Integração */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Exemplos de Integração</h3>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Enviando mensagem via webhook:</h4>
              <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
{`// JavaScript/Node.js
const response = await fetch('${webhookUrls.whatsapp || 'SEU_WEBHOOK_WHATSAPP'}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone: '5582999999999',
    message: 'Olá! Esta é uma mensagem de teste.',
    lead_id: 'uuid-do-lead'
  })
});

// cURL
curl -X POST "${webhookUrls.whatsapp || 'SEU_WEBHOOK_WHATSAPP'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "5582999999999",
    "message": "Olá! Esta é uma mensagem de teste.",
    "lead_id": "uuid-do-lead"
  }'`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default APIsSettings;
