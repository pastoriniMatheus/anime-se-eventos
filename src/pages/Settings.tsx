import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Webhook, Palette, Type, Database, Users, Settings2, Globe } from 'lucide-react';
import WebhookSettings from '@/components/WebhookSettings';
import VisualSettings from '@/components/VisualSettings';
import FormSettings from '@/components/FormSettings';
import DatabaseExport from '@/components/DatabaseExport';
import StatusManager from '@/components/StatusManager';
import NomenclatureSettings from '@/components/NomenclatureSettings';
import EnrollmentStatusSettings from '@/components/EnrollmentStatusSettings';
import APIsSettings from '@/components/APIsSettings';
import { useNomenclature } from '@/hooks/useNomenclature';
import { Layout } from '@/components/Layout';

const Settings = () => {
  const [activeMainTab, setActiveMainTab] = useState('webhooks');
  const [activeSecondaryTab, setActiveSecondaryTab] = useState('webhooks');
  const { data: nomenclature } = useNomenclature();

  const courseNomenclature = nomenclature?.course_nomenclature || 'Cursos';
  const postgraduateNomenclature = nomenclature?.postgraduate_nomenclature || 'Pós-graduação';
  const supabaseUrl = "https://iznfrkdsmbtymnifqcdd.supabase.co";

  return (
    <Layout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-blue-600">Configurações do Sistema</h1>
      </div>

      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="webhooks" className="flex items-center space-x-2">
            <Webhook className="h-4 w-4" />
            <span>Webhooks & APIs</span>
          </TabsTrigger>
          <TabsTrigger value="visual" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Visual</span>
          </TabsTrigger>
          <TabsTrigger value="form" className="flex items-center space-x-2">
            <Settings2 className="h-4 w-4" />
            <span>Formulário</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Dados</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks">
          <Tabs value={activeSecondaryTab} onValueChange={setActiveSecondaryTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="webhooks">Configurações de Webhook</TabsTrigger>
              <TabsTrigger value="apis">APIs & Endpoints</TabsTrigger>
            </TabsList>

            <TabsContent value="webhooks">
              <WebhookSettings />
            </TabsContent>

            <TabsContent value="apis">
              <APIsSettings />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="visual">
          <Tabs defaultValue="colors" className="space-y-4">
            <TabsList>
              <TabsTrigger value="colors">Cores e Visual</TabsTrigger>
              <TabsTrigger value="nomenclature">Nomenclaturas</TabsTrigger>
            </TabsList>

            <TabsContent value="colors">
              <VisualSettings />
            </TabsContent>

            <TabsContent value="nomenclature">
              <NomenclatureSettings />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="form">
          <Tabs defaultValue="form-settings" className="space-y-4">
            <TabsList>
              <TabsTrigger value="form-settings">Configurações do Formulário</TabsTrigger>
              <TabsTrigger value="enrollment-status">Status de Matrícula</TabsTrigger>
            </TabsList>

            <TabsContent value="form-settings">
              <FormSettings />
            </TabsContent>

            <TabsContent value="enrollment-status">
              <EnrollmentStatusSettings />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="data">
          <Tabs defaultValue="status" className="space-y-4">
            <TabsList>
              <TabsTrigger value="status">Status de Leads</TabsTrigger>
              <TabsTrigger value="export">Exportar/Importar</TabsTrigger>
              <TabsTrigger value="info">Informações do Sistema</TabsTrigger>
            </TabsList>

            <TabsContent value="status">
              <StatusManager />
            </TabsContent>

            <TabsContent value="export">
              <DatabaseExport />
            </TabsContent>

            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Informações do Sistema</span>
                  </CardTitle>
                  <CardDescription>
                    Informações técnicas sobre o sistema e configurações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">URL do Supabase:</span>
                      <code className="text-sm bg-background px-2 py-1 rounded">
                        {supabaseUrl}
                      </code>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">Nomenclatura {courseNomenclature}:</span>
                      <Badge variant="outline">{courseNomenclature}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">Nomenclatura {postgraduateNomenclature}:</span>
                      <Badge variant="outline">{postgraduateNomenclature}</Badge>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Sistema de Gestão de Leads
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Sistema completo para captura, gestão e acompanhamento de leads educacionais com integração WhatsApp, QR Codes e relatórios avançados.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
