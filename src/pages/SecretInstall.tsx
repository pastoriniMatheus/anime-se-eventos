
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Database, Server, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DatabaseConfig {
  type: 'supabase' | 'postgresql' | 'mysql';
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

  // Verificar parâmetro de segurança na URL
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
    setInstallationLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    setIsLoading(true);
    addLog('Testando conexão com o banco de dados...');

    try {
      if (config.type === 'supabase') {
        // Testar conexão Supabase
        const { data, error } = await supabase.functions.invoke('database-installer', {
          body: {
            action: 'test_connection',
            config: config
          }
        });

        if (error) throw error;
        
        addLog('Conexão Supabase estabelecida com sucesso');
        setExistingTables(data.existingTables || []);
      } else {
        // Testar conexão banco personalizado
        const response = await fetch('/api/test-db-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });

        if (!response.ok) throw new Error('Falha na conexão');
        
        const result = await response.json();
        setExistingTables(result.existingTables || []);
        addLog('Conexão com banco personalizado estabelecida');
      }

      setInstallationStep('verify');
      toast({
        title: "Conexão bem-sucedida",
        description: "Banco de dados acessível. Verificando estrutura...",
      });

    } catch (error: any) {
      addLog(`Erro na conexão: ${error.message}`);
      toast({
        title: "Erro de conexão",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const performInstallation = async () => {
    setIsLoading(true);
    setInstallationStep('install');
    addLog('Iniciando instalação do banco de dados...');

    try {
      const { data, error } = await supabase.functions.invoke('database-installer', {
        body: {
          action: 'install',
          config: config,
          overwriteTables: existingTables.length > 0
        }
      });

      if (error) throw error;

      addLog('Todas as tabelas criadas com sucesso');
      addLog('Dados iniciais inseridos');
      addLog('Configuração salva');
      addLog('Sistema instalado e pronto para uso');

      setInstallationStep('complete');
      
      toast({
        title: "Instalação concluída",
        description: "Sistema instalado com sucesso! Redirecionando...",
      });

      // Redirecionar após 3 segundos
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);

    } catch (error: any) {
      addLog(`Erro na instalação: ${error.message}`);
      toast({
        title: "Erro na instalação",
        description: error.message,
        variant: "destructive",
      });
      setInstallationStep('verify');
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
        </div>
        <div className="space-y-2">
          <Label htmlFor="supabase-anon">Anon Key</Label>
          <Input
            id="supabase-anon"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
            value={config.supabaseAnonKey || ''}
            onChange={(e) => setConfig({ ...config, supabaseAnonKey: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supabase-service">Service Role Key</Label>
          <Input
            id="supabase-service"
            type="password"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
            value={config.supabaseServiceKey || ''}
            onChange={(e) => setConfig({ ...config, supabaseServiceKey: e.target.value })}
          />
        </div>
      </TabsContent>

      <TabsContent value="postgresql" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="host">Host</Label>
            <Input
              id="host"
              placeholder="localhost"
              value={config.host || ''}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="port">Porta</Label>
            <Input
              id="port"
              type="number"
              placeholder="5432"
              value={config.port || ''}
              onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="database">Database</Label>
          <Input
            id="database"
            placeholder="meu_sistema"
            value={config.database || ''}
            onChange={(e) => setConfig({ ...config, database: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="username">Usuário</Label>
            <Input
              id="username"
              placeholder="postgres"
              value={config.username || ''}
              onChange={(e) => setConfig({ ...config, username: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={config.password || ''}
              onChange={(e) => setConfig({ ...config, password: e.target.value })}
            />
          </div>
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
                  Conexão estabelecida com sucesso! Verificação concluída.
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
                    As tabelas serão sobrescritas durante a instalação
                  </p>
                </div>
              )}

              <Button onClick={performInstallation} className="w-full">
                <Database className="h-4 w-4 mr-2" />
                Iniciar Instalação
              </Button>
            </div>
          )}

          {(installationStep === 'install' || installationStep === 'complete') && (
            <div className="space-y-4">
              <div className="bg-gray-50 border rounded-lg p-4 max-h-64 overflow-y-auto">
                <h4 className="font-medium mb-2">Log de Instalação:</h4>
                <div className="space-y-1 text-sm font-mono">
                  {installationLog.map((log, index) => (
                    <div key={index} className="text-gray-700">{log}</div>
                  ))}
                </div>
              </div>

              {installationStep === 'complete' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-green-800 mb-1">Instalação Concluída!</h4>
                  <p className="text-sm text-green-700">
                    Sistema instalado com sucesso. Redirecionando para login...
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecretInstall;
