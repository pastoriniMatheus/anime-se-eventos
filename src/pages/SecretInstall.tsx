
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Database, Server, Check, AlertTriangle, Loader2 } from 'lucide-react';

interface DatabaseConfig {
  type: 'supabase' | 'postgresql';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceKey?: string;
}

const SecretInstall = () => {
  const { toast } = useToast();
  const [installationStep, setInstallationStep] = useState<'config' | 'verify' | 'install' | 'complete'>('config');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<DatabaseConfig>({ type: 'supabase' });
  const [existingTables, setExistingTables] = useState<string[]>([]);
  const [installationLog, setInstallationLog] = useState<string[]>([]);

  // Check security parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const authKey = urlParams.get('key');
  
  if (authKey !== 'admin123') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
              <p className="text-gray-600">Parâmetro de autenticação inválido</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    setInstallationLog(prev => [...prev, logMessage]);
    console.log('[SecretInstall]', logMessage);
  };

  const testConnection = async () => {
    setIsLoading(true);
    setInstallationLog([]);
    addLog('Iniciando teste de conexão...');

    try {
      if (config.type === 'supabase') {
        if (!config.supabaseUrl || !config.supabaseServiceKey) {
          throw new Error('URL do Supabase e Service Key são obrigatórios');
        }
        
        if (!config.supabaseUrl.includes('supabase.co')) {
          throw new Error('URL do Supabase deve conter "supabase.co"');
        }

        const cleanUrl = config.supabaseUrl.replace(/\/$/, '');
        addLog('Configuração Supabase validada localmente');
        addLog(`Testando conexão com: ${cleanUrl}`);

        try {
          const { createClient } = await import('@supabase/supabase-js');
          const targetSupabase = createClient(cleanUrl, config.supabaseServiceKey);
          
          addLog('Testando conexão básica...');
          
          // Test basic connection with RPC call that should exist in any Supabase project
          const { data: versionData, error: versionError } = await targetSupabase.rpc('version');
          
          if (versionError && !versionError.message.includes('function version() does not exist')) {
            addLog(`Erro na conexão básica: ${versionError.message}`);
            throw new Error(`Falha na conexão: ${versionError.message}`);
          }

          addLog('Conexão estabelecida com sucesso!');
          
          // Check for existing tables using SQL query
          addLog('Verificando tabelas existentes...');
          const { data: tablesData, error: tablesError } = await targetSupabase
            .rpc('sql', {
              query: `
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN (
                  'authorized_users', 'courses', 'postgraduate_courses', 'lead_statuses',
                  'events', 'qr_codes', 'scan_sessions', 'leads', 'message_history'
                )
              `
            });

          let existingTablesList: string[] = [];
          
          if (!tablesError && tablesData) {
            existingTablesList = Array.isArray(tablesData) ? 
              tablesData.map((row: any) => row.table_name) : [];
          }
          
          setExistingTables(existingTablesList);

          if (existingTablesList.length > 0) {
            addLog(`Encontradas ${existingTablesList.length} tabelas existentes: ${existingTablesList.join(', ')}`);
          } else {
            addLog('Nenhuma tabela existente encontrada - instalação limpa');
          }

          setInstallationStep('verify');
          
          toast({
            title: "Conexão bem-sucedida",
            description: "Banco de dados acessível e validado",
          });

        } catch (directError: any) {
          addLog(`Erro na conexão: ${directError.message}`);
          throw directError;
        }
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Erro desconhecido';
      addLog(`ERRO: ${errorMessage}`);
      
      console.error('[SecretInstall] Error details:', error);
      
      toast({
        title: "Erro de conexão",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startInstallation = async () => {
    setIsLoading(true);
    setInstallationStep('install');
    addLog('Iniciando instalação do sistema...');

    try {
      if (config.type === 'supabase') {
        const { createClient } = await import('@supabase/supabase-js');
        const targetSupabase = createClient(config.supabaseUrl!, config.supabaseServiceKey!);
        
        // Execute database schema installation
        addLog('Executando script de criação do banco de dados...');
        
        // Read and execute the database schema using the Edge Function
        const SUPABASE_URL = "https://dobtquebpcnzjisftcfh.supabase.co";
        const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYnRxdWVicGNuemppc2Z0Y2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NzcyNTMsImV4cCI6MjA2NTE1MzI1M30.GvPd5cEdgmAZG-Jsch66mdX24QNosV12Tz-F1Af93_0";

        const response = await fetch(`${SUPABASE_URL}/functions/v1/database-installer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'apikey': SUPABASE_KEY,
          },
          body: JSON.stringify({
            action: 'install',
            config: config
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Falha na instalação');
        }

        addLog('Sistema instalado com sucesso!');
        addLog('Todas as tabelas foram criadas');
        addLog('Usuário padrão criado: cesmac / cesmac@2025');
        
        setInstallationStep('complete');
        
        toast({
          title: "Instalação concluída",
          description: "Sistema instalado com sucesso no banco de dados",
        });
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Erro na instalação';
      addLog(`ERRO: ${errorMessage}`);
      
      toast({
        title: "Erro na instalação",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderConfigForm = () => (
    <Tabs value={config.type} onValueChange={(value: any) => setConfig({ ...config, type: value })}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="supabase">Supabase</TabsTrigger>
        <TabsTrigger value="postgresql">PostgreSQL</TabsTrigger>
      </TabsList>

      <TabsContent value="supabase" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="supabase-url">URL do Projeto Supabase</Label>
          <Input
            id="supabase-url"
            placeholder="https://xyz.supabase.co"
            value={config.supabaseUrl || ''}
            onChange={(e) => setConfig({ ...config, supabaseUrl: e.target.value })}
          />
          <p className="text-xs text-gray-500">Exemplo: https://abc123.supabase.co</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="supabase-anon">Anon Key (Opcional)</Label>
          <Input
            id="supabase-anon"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
            value={config.supabaseAnonKey || ''}
            onChange={(e) => setConfig({ ...config, supabaseAnonKey: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supabase-service">Service Role Key *</Label>
          <Input
            id="supabase-service"
            type="password"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
            value={config.supabaseServiceKey || ''}
            onChange={(e) => setConfig({ ...config, supabaseServiceKey: e.target.value })}
          />
          <p className="text-xs text-gray-500">Necessário para criar/modificar tabelas</p>
        </div>
      </TabsContent>

      <TabsContent value="postgresql" className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            PostgreSQL customizado ainda não está implementado. Use Supabase por enquanto.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Database className="h-6 w-6 text-blue-600" />
            <CardTitle>Instalação do Sistema</CardTitle>
          </div>
          <CardDescription>
            Configure e instale o sistema de leads em seu banco de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between">
            {['config', 'verify', 'install', 'complete'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  installationStep === step ? 'bg-blue-600 text-white' :
                  ['config', 'verify', 'install', 'complete'].indexOf(installationStep) > index ? 'bg-green-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {['config', 'verify', 'install', 'complete'].indexOf(installationStep) > index ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 3 && <div className="w-16 h-1 bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>

          {installationStep === 'config' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Configure as credenciais do banco onde o sistema será instalado.
                  Todas as tabelas e estruturas necessárias serão criadas automaticamente.
                </p>
              </div>
              
              {renderConfigForm()}

              <Button 
                onClick={testConnection} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testando conexão...
                  </>
                ) : (
                  <>
                    <Server className="h-4 w-4 mr-2" />
                    Testar Conexão
                  </>
                )}
              </Button>
            </div>
          )}

          {installationStep === 'verify' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  Conexão estabelecida com sucesso! Pronto para instalação.
                </p>
              </div>

              {existingTables.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-800 mb-2">
                    Tabelas existentes encontradas:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {existingTables.map(table => (
                      <Badge key={table} variant="secondary">{table}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-amber-700 mt-2">
                    As tabelas serão recriadas durante a instalação
                  </p>
                </div>
              )}

              <Button 
                onClick={startInstallation}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Instalando...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Iniciar Instalação
                  </>
                )}
              </Button>
            </div>
          )}

          {installationStep === 'install' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Instalação em andamento... Por favor, aguarde.
                </p>
              </div>
            </div>
          )}

          {installationStep === 'complete' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">
                  ✅ Instalação concluída com sucesso!
                </h4>
                <p className="text-sm text-green-700">
                  O sistema foi instalado no banco de dados configurado.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Credenciais de acesso:</h4>
                <p className="text-sm text-blue-700">
                  <strong>Usuário:</strong> cesmac<br />
                  <strong>Senha:</strong> cesmac@2025
                </p>
              </div>

              <Button 
                onClick={() => window.location.href = '/login'}
                className="w-full"
              >
                Ir para Login
              </Button>
            </div>
          )}

          {/* Installation log */}
          {installationLog.length > 0 && (
            <div className="bg-gray-50 border rounded-lg p-4 max-h-64 overflow-y-auto">
              <h4 className="font-medium mb-2">Log de Instalação:</h4>
              <div className="space-y-1 text-sm font-mono">
                {installationLog.map((log, index) => (
                  <div key={index} className="text-gray-700">{log}</div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecretInstall;
