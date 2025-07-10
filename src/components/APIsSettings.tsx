
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, RefreshCw, Globe, Database, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface Endpoint {
  name: string;
  url: string;
  method: string;
  description: string;
  status: 'active' | 'inactive' | 'testing';
  category: 'supabase' | 'external' | 'internal';
  requiresAuth: boolean;
}

const APIsSettings = () => {
  const { toast } = useToast();
  const { data: settings } = useSystemSettings();
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectId] = useState('iznfrkdsmbtynmifqcdd');

  // Gerar endpoints automaticamente baseado no banco e configurações
  useEffect(() => {
    const generateEndpoints = async () => {
      setIsLoading(true);
      
      try {
        // Edge Functions do Supabase (automáticos)
        const supabaseEndpoints: Endpoint[] = [
          {
            name: 'Lead Capture',
            url: `https://${projectId}.supabase.co/functions/v1/lead-capture`,
            method: 'POST',
            description: 'Capturar novos leads via formulário',
            status: 'active',
            category: 'supabase',
            requiresAuth: false
          },
          {
            name: 'Send Webhook',
            url: `https://${projectId}.supabase.co/functions/v1/send-webhook`,
            method: 'POST',
            description: 'Enviar dados via webhook para sistemas externos',
            status: 'active',
            category: 'supabase',
            requiresAuth: true
          },
          {
            name: 'QR Redirect',
            url: `https://${projectId}.supabase.co/functions/v1/qr-redirect`,
            method: 'GET',
            description: 'Redirecionamento inteligente de QR codes',
            status: 'active',
            category: 'supabase',
            requiresAuth: false
          },
          {
            name: 'WhatsApp Validation',
            url: `https://${projectId}.supabase.co/functions/v1/validate-whatsapp`,
            method: 'POST',
            description: 'Validar números de WhatsApp',
            status: 'active',
            category: 'supabase',
            requiresAuth: true
          },
          {
            name: 'Message Delivery Webhook',
            url: `https://${projectId}.supabase.co/functions/v1/message-delivery-webhook`,
            method: 'POST',
            description: 'Confirmar entrega de mensagens',
            status: 'active',
            category: 'supabase',
            requiresAuth: false
          },
          {
            name: 'Database Export',
            url: `https://${projectId}.supabase.co/functions/v1/database-export`,
            method: 'POST',
            description: 'Exportar dados do banco em CSV',
            status: 'active',
            category: 'supabase',
            requiresAuth: true
          },
          {
            name: 'Sync Leads',
            url: `https://${projectId}.supabase.co/functions/v1/sync-leads`,
            method: 'POST',
            description: 'Sincronizar leads com sistemas externos',
            status: 'active',
            category: 'supabase',
            requiresAuth: true
          }
        ];

        // Webhooks externos configurados
        const webhookSettings = settings?.find(s => s.key === 'webhook_urls');
        const externalEndpoints: Endpoint[] = [];
        
        if (webhookSettings?.value) {
          const urls = typeof webhookSettings.value === 'string' 
            ? JSON.parse(webhookSettings.value) 
            : webhookSettings.value;
          
          Object.entries(urls).forEach(([key, url]: [string, any]) => {
            if (url && url.trim()) {
              externalEndpoints.push({
                name: `Webhook ${key.toUpperCase()}`,
                url: url as string,
                method: 'POST',
                description: `Webhook configurado para ${key}`,
                status: 'active',
                category: 'external',
                requiresAuth: false
              });
            }
          });
        }

        // APIs REST do Supabase (automáticas baseadas nas tabelas)
        const restEndpoints: Endpoint[] = [
          {
            name: 'Leads API',
            url: `https://${projectId}.supabase.co/rest/v1/leads`,
            method: 'GET/POST/PATCH/DELETE',
            description: 'CRUD para tabela de leads',
            status: 'active',
            category: 'supabase',
            requiresAuth: true
          },
          {
            name: 'Events API',
            url: `https://${projectId}.supabase.co/rest/v1/events`,
            method: 'GET/POST/PATCH/DELETE',
            description: 'CRUD para tabela de eventos',
            status: 'active',
            category: 'supabase',
            requiresAuth: true
          },
          {
            name: 'Courses API',
            url: `https://${projectId}.supabase.co/rest/v1/courses`,
            method: 'GET/POST/PATCH/DELETE',
            description: 'CRUD para tabela de cursos',
            status: 'active',
            category: 'supabase',
            requiresAuth: true
          },
          {
            name: 'Message History API',
            url: `https://${projectId}.supabase.co/rest/v1/message_history`,
            method: 'GET/POST/PATCH/DELETE',
            description: 'CRUD para histórico de mensagens',
            status: 'active',
            category: 'supabase',
            requiresAuth: true
          }
        ];

        setEndpoints([...supabaseEndpoints, ...externalEndpoints, ...restEndpoints]);
      } catch (error) {
        console.error('Erro ao gerar endpoints:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar endpoints",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    generateEndpoints();
  }, [projectId, settings, toast]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "URL copiada para a área de transferência",
    });
  };

  const refreshEndpoints = () => {
    setIsLoading(true);
    // Força recarga dos endpoints
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'testing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'supabase': return <Database className="h-4 w-4" />;
      case 'external': return <Globe className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const groupedEndpoints = {
    supabase: endpoints.filter(e => e.category === 'supabase'),
    external: endpoints.filter(e => e.category === 'external'),
    internal: endpoints.filter(e => e.category === 'internal')
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">APIs & Endpoints</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie e monitore todos os endpoints do sistema
          </p>
        </div>
        
        <Button onClick={refreshEndpoints} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Endpoints</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{endpoints.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Edge Functions</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedEndpoints.supabase.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks Externos</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedEndpoints.external.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos ({endpoints.length})</TabsTrigger>
          <TabsTrigger value="supabase">Supabase ({groupedEndpoints.supabase.length})</TabsTrigger>
          <TabsTrigger value="external">Externos ({groupedEndpoints.external.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {endpoints.map((endpoint, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(endpoint.category)}
                    <CardTitle className="text-base">{endpoint.name}</CardTitle>
                    <Badge className={getStatusColor(endpoint.status)}>
                      {endpoint.status}
                    </Badge>
                    {endpoint.requiresAuth && (
                      <Badge variant="secondary">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Auth Required
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(endpoint.url)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>{endpoint.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{endpoint.method}</Badge>
                  <code className="text-sm bg-muted px-2 py-1 rounded break-all">
                    {endpoint.url}
                  </code>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="supabase" className="space-y-4">
          {groupedEndpoints.supabase.map((endpoint, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4" />
                    <CardTitle className="text-base">{endpoint.name}</CardTitle>
                    <Badge className={getStatusColor(endpoint.status)}>
                      {endpoint.status}
                    </Badge>
                    {endpoint.requiresAuth && (
                      <Badge variant="secondary">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Auth Required
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(endpoint.url)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>{endpoint.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{endpoint.method}</Badge>
                  <code className="text-sm bg-muted px-2 py-1 rounded break-all">
                    {endpoint.url}
                  </code>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="external" className="space-y-4">
          {groupedEndpoints.external.length > 0 ? (
            groupedEndpoints.external.map((endpoint, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <CardTitle className="text-base">{endpoint.name}</CardTitle>
                      <Badge className={getStatusColor(endpoint.status)}>
                        {endpoint.status}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(endpoint.url)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>{endpoint.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{endpoint.method}</Badge>
                    <code className="text-sm bg-muted px-2 py-1 rounded break-all">
                      {endpoint.url}
                    </code>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Nenhum webhook externo configurado</h3>
                <p className="text-muted-foreground mb-4">
                  Configure webhooks externos nas configurações do sistema
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default APIsSettings;
