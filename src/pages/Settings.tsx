
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Database, MessageSquare, BookOpen, GraduationCap, Webhook, Palette, Eye, FileText, Globe, Type, Code, ExternalLink, Key, Shield } from 'lucide-react';
import CourseManager from '@/components/CourseManager';
import PostgraduateCourseManager from '@/components/PostgraduateCourseManager';
import StatusManager from '@/components/StatusManager';
import DatabaseExport from '@/components/DatabaseExport';
import WebhookSettings from '@/components/WebhookSettings';
import VisualSettings from '@/components/VisualSettings';
import FormSettings from '@/components/FormSettings';
import NomenclatureSettings from '@/components/NomenclatureSettings';
import EnrollmentStatusSettings from '@/components/EnrollmentStatusSettings';
import { useNomenclature } from '@/hooks/useNomenclature';

const Settings = () => {
  const [activeMainTab, setActiveMainTab] = useState('webhooks');
  const [activeCourseTab, setActiveCourseTab] = useState('cursos');
  const [activeProductTab, setActiveProductTab] = useState('cursos');
  const { courseNomenclature, postgraduateNomenclature } = useNomenclature();

  const baseUrl = window.location.origin;
  const supabaseUrl = "https://iznfrkdsmbtymnifqcdd.supabase.co";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-blue-600">Configurações do Sistema</h1>
      </div>

      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="webhooks" className="flex items-center space-x-2">
            <Webhook className="h-4 w-4" />
            <span>Webhooks</span>
          </TabsTrigger>
          <TabsTrigger value="visual" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Visual</span>
          </TabsTrigger>
          <TabsTrigger value="formulario" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Formulário</span>
          </TabsTrigger>
          <TabsTrigger value="nomenclature" className="flex items-center space-x-2">
            <Type className="h-4 w-4" />
            <span>Nomes</span>
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Status</span>
          </TabsTrigger>
          <TabsTrigger value="produtos" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Produtos</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>API</span>
          </TabsTrigger>
          <TabsTrigger value="banco" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Banco de Dados</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks">
          <WebhookSettings />
        </TabsContent>

        <TabsContent value="visual">
          <VisualSettings />
        </TabsContent>

        <TabsContent value="formulario">
          <FormSettings />
        </TabsContent>

        <TabsContent value="nomenclature">
          <NomenclatureSettings />
        </TabsContent>

        <TabsContent value="status">
          <StatusManager />
        </TabsContent>

        <TabsContent value="produtos">
          <Tabs value={activeProductTab} onValueChange={setActiveProductTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cursos" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>{courseNomenclature}</span>
              </TabsTrigger>
              <TabsTrigger value="pos" className="flex items-center space-x-2">
                <GraduationCap className="h-4 w-4" />
                <span>{postgraduateNomenclature}</span>
              </TabsTrigger>
              <TabsTrigger value="matricula" className="flex items-center space-x-2">
                <GraduationCap className="h-4 w-4" />
                <span>Matrícula</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cursos">
              <CourseManager />
            </TabsContent>

            <TabsContent value="pos">
              <PostgraduateCourseManager />
            </TabsContent>

            <TabsContent value="matricula">
              <EnrollmentStatusSettings />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Documentação da API</span>
              </CardTitle>
              <CardDescription>
                Endpoints disponíveis no sistema e como utilizá-los
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Informações de Autenticação */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-800">Autenticação da API</h4>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-blue-700">
                    <strong>API Key (obrigatória para alguns endpoints):</strong>
                  </p>
                  <div className="bg-blue-100 p-3 rounded text-sm">
                    <code className="text-blue-800">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6bmZya2RzbWJ0eW5taWZxY2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzIzOTAsImV4cCI6MjA2NzMwODM5MH0.8Rqh2hxan513BDqxDSYM_sy8O-hEPlAb9OLL166BzIQ</code>
                  </div>
                  <p className="text-xs text-blue-600">
                    Use no header: <code>apikey: [chave-acima]</code>
                  </p>
                </div>
                <div className="text-xs text-blue-600">
                  <p><strong>Endpoints que REQUEREM API Key:</strong> Todos os endpoints do Supabase Edge Functions</p>
                  <p><strong>Endpoints que NÃO requerem API Key:</strong> Endpoints dinâmicos da aplicação (ex: /api/message-delivery-webhook)</p>
                </div>
              </div>

              {/* Endpoints de Leads */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600">Endpoints de Leads</h3>
                
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">POST</Badge>
                      <code className="text-sm">{supabaseUrl}/functions/v1/lead-capture</code>
                      <Badge variant="secondary" className="bg-red-50 text-red-700"><Key className="h-3 w-3 mr-1" />API Key</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Captura de leads via formulário</p>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <strong>Headers necessários:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">apikey: [sua-api-key]</pre>
                    <strong>Body:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">{`{
  "name": "Nome do Lead",
  "email": "email@exemplo.com",
  "whatsapp": "+5511999999999",
  "course_id": "uuid-do-curso",
  "event_id": "uuid-do-evento"
}`}</pre>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">POST</Badge>
                      <code className="text-sm">{supabaseUrl}/functions/v1/lead-status-callback</code>
                      <Badge variant="secondary" className="bg-red-50 text-red-700"><Key className="h-3 w-3 mr-1" />API Key</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Webhook para atualização de status de leads</p>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <strong>Headers necessários:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">apikey: [sua-api-key]</pre>
                    <strong>Body:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">{`{
  "lead_id": "uuid-do-lead",
  "status_id": "uuid-do-status",
  "notes": "Observações opcionais"
}`}</pre>
                  </div>
                </div>
              </div>

              {/* Endpoints de WhatsApp */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600">Endpoints de WhatsApp</h3>
                
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">POST</Badge>
                      <code className="text-sm">{supabaseUrl}/functions/v1/validate-whatsapp</code>
                      <Badge variant="secondary" className="bg-red-50 text-red-700"><Key className="h-3 w-3 mr-1" />API Key</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Validação de números do WhatsApp</p>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <strong>Headers necessários:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">apikey: [sua-api-key]</pre>
                    <strong>Body:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">{`{
  "whatsapp": "+5511999999999"
}`}</pre>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">POST</Badge>
                      <code className="text-sm">{supabaseUrl}/functions/v1/whatsapp-validation-callback</code>
                      <Badge variant="secondary" className="bg-red-50 text-red-700"><Key className="h-3 w-3 mr-1" />API Key</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Callback para resultado da validação do WhatsApp</p>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <strong>Headers necessários:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">apikey: [sua-api-key]</pre>
                    <strong>Body:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">{`{
  "whatsapp": "+5511999999999",
  "status": "valid|invalid",
  "message": "Resultado da validação"
}`}</pre>
                  </div>
                </div>
              </div>

              {/* Endpoints de Mensagens */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600">Endpoints de Mensagens</h3>
                
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">POST</Badge>
                      <code className="text-sm">{baseUrl}/api/message-delivery-webhook</code>
                      <Badge variant="secondary" className="bg-green-50 text-green-700">Público</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Confirmação de entrega de mensagens (Endpoint Dinâmico - Não requer API Key)</p>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <strong>Body:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">{`{
  "delivery_code": "MSG-1234567890-abc123",
  "lead_identifier": "email@exemplo.com",
  "status": "delivered"
}`}</pre>
                  </div>
                  <div className="bg-blue-50 p-3 rounded text-sm mt-2">
                    <strong>Observação:</strong> Este endpoint é dinâmico e se adapta automaticamente ao domínio da aplicação. 
                    Internamente redireciona para a Edge Function do Supabase.
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">POST</Badge>
                      <code className="text-sm">{supabaseUrl}/functions/v1/send-webhook</code>
                      <Badge variant="secondary" className="bg-red-50 text-red-700"><Key className="h-3 w-3 mr-1" />API Key</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Envio de webhooks para sistemas externos</p>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <strong>Headers necessários:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">apikey: [sua-api-key]</pre>
                    <strong>Body:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">{`{
  "webhook_url": "https://exemplo.com/webhook",
  "webhook_data": {
    "type": "whatsapp",
    "content": "Mensagem a ser enviada",
    "recipients": [
      {
        "name": "Nome do Lead",
        "whatsapp": "+5511999999999",
        "email": "email@exemplo.com"
      }
    ]
  }
}`}</pre>
                  </div>
                </div>
              </div>

              {/* Endpoints de QR Code */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600">Endpoints de QR Code</h3>
                
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700">GET</Badge>
                      <code className="text-sm">{supabaseUrl}/functions/v1/qr-redirect/:tracking_id</code>
                      <Badge variant="secondary" className="bg-green-50 text-green-700">Público</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Redirecionamento de QR Codes com tracking</p>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <strong>Parâmetros:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">tracking_id: ID único do QR Code</pre>
                  </div>
                </div>
              </div>

              {/* Endpoints de Relatórios */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600">Endpoints de Relatórios</h3>
                
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700">POST</Badge>
                      <code className="text-sm">{supabaseUrl}/functions/v1/generate-event-report</code>
                      <Badge variant="secondary" className="bg-red-50 text-red-700"><Key className="h-3 w-3 mr-1" />API Key</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Geração de relatórios de eventos</p>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <strong>Headers necessários:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">apikey: [sua-api-key]</pre>
                    <strong>Body:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">{`{
  "event_id": "uuid-do-evento",
  "format": "pdf|csv|json"
}`}</pre>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700">GET</Badge>
                      <code className="text-sm">{supabaseUrl}/functions/v1/database-export</code>
                      <Badge variant="secondary" className="bg-red-50 text-red-700"><Key className="h-3 w-3 mr-1" />API Key</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Exportação completa do banco de dados</p>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <strong>Headers necessários:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">apikey: [sua-api-key]</pre>
                    <strong>Query Params:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">format=json|csv</pre>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">POST</Badge>
                      <code className="text-sm">{supabaseUrl}/functions/v1/sync-leads</code>
                      <Badge variant="secondary" className="bg-red-50 text-red-700"><Key className="h-3 w-3 mr-1" />API Key</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Sincronização automática de leads</p>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <strong>Headers necessários:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">apikey: [sua-api-key]</pre>
                    <strong>Body:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">{`{
  "webhook_url": "https://exemplo.com/webhook",
  "mode": "all|new_only"
}`}</pre>
                  </div>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-blue-800">Informações Importantes</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Endpoints com API Key:</strong> Todos os endpoints do Supabase Edge Functions requerem autenticação</li>
                  <li>• <strong>Endpoints Públicos:</strong> Endpoints dinâmicos da aplicação não requerem API Key</li>
                  <li>• <strong>Rate Limiting:</strong> 60 requests por minuto por IP para endpoints públicos</li>
                  <li>• <strong>Logs:</strong> Todas as requisições são mantidas por 30 dias</li>
                  <li>• <strong>Formato de Resposta:</strong> Sempre JSON</li>
                  <li>• <strong>CORS:</strong> Configurado para permitir requisições de qualquer origem</li>
                </ul>
              </div>

              {/* Exemplos de Uso */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-600">Exemplos de Uso</h3>
                
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-medium">Capturar um novo lead via JavaScript:</h4>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                    <pre>{`const response = await fetch('${supabaseUrl}/functions/v1/lead-capture', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  body: JSON.stringify({
    name: 'João Silva',
    email: 'joao@exemplo.com',
    whatsapp: '+5511999999999',
    course_id: 'uuid-do-curso',
    event_id: 'uuid-do-evento'
  })
});

const result = await response.json();
console.log(result);`}</pre>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-medium">Confirmar entrega de mensagem via cURL:</h4>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                    <pre>{`curl -X POST "${baseUrl}/api/message-delivery-webhook" \\
  -H "Content-Type: application/json" \\
  -d '{
    "delivery_code": "MSG-1234567890-abc123",
    "lead_identifier": "joao@exemplo.com",
    "status": "delivered"
  }'`}</pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banco">
          <DatabaseExport />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
