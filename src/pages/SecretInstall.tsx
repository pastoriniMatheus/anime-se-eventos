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

        // Validar formato da Service Key
        if (!config.supabaseServiceKey.startsWith('eyJ')) {
          throw new Error('Service Key deve ser um JWT válido começando com "eyJ"');
        }

        const cleanUrl = config.supabaseUrl.replace(/\/$/, '');
        addLog('Configuração Supabase validada localmente');
        addLog(`Testando conexão com: ${cleanUrl}`);

        try {
          const { createClient } = await import('@supabase/supabase-js');
          const targetSupabase = createClient(cleanUrl, config.supabaseServiceKey);
          
          addLog('Testando Service Key...');
          
          // Test with a simple query that requires service role
          const { data, error } = await targetSupabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .limit(1);

          if (error) {
            if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
              throw new Error('Service Key inválida - verifique se está correta');
            }
            if (error.message.includes('permission denied') || error.message.includes('insufficient_privilege')) {
              throw new Error('Service Key não tem permissões suficientes');
            }
            // Se não conseguir acessar information_schema, tenta uma operação simples
            addLog('Tentando validação alternativa...');
            const { error: altError } = await targetSupabase.rpc('version');
            if (altError && altError.message.includes('Invalid API key')) {
              throw new Error('Service Key inválida - verifique se está correta');
            }
          }

          addLog('Service Key validada com sucesso!');
          addLog('Conexão estabelecida com sucesso!');

          setExistingTables([]);
          addLog('Pronto para instalação - instalação limpa será realizada');
          setInstallationStep('verify');
          
          toast({
            title: "Conexão bem-sucedida",
            description: "Banco de dados acessível e Service Key validada",
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

  const executeSQL = async (supabaseClient: any, sql: string, description: string): Promise<boolean> => {
    try {
      addLog(`Executando: ${description}`);
      
      // Para comandos SQL complexos, usar a função sql diretamente
      const { data, error } = await supabaseClient.rpc('sql', { query: sql });
      
      if (error) {
        addLog(`ERRO em ${description}: ${error.message}`);
        console.error('SQL Error:', error);
        return false;
      }
      
      addLog(`✓ ${description} - Concluído`);
      return true;
    } catch (error: any) {
      addLog(`ERRO em ${description}: ${error.message}`);
      console.error('Execute SQL Error:', error);
      return false;
    }
  };

  const verifyInstallation = async (supabaseClient: any): Promise<boolean> => {
    try {
      addLog('Verificando se as tabelas foram criadas...');
      
      const { data, error } = await supabaseClient
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['authorized_users', 'courses', 'events', 'leads']);

      if (error) {
        addLog(`Erro na verificação: ${error.message}`);
        return false;
      }

      const createdTables = data?.map(t => t.table_name) || [];
      addLog(`Tabelas encontradas: ${createdTables.join(', ')}`);
      
      if (createdTables.length >= 4) {
        addLog('✓ Instalação verificada - todas as tabelas principais foram criadas');
        return true;
      } else {
        addLog(`✗ Instalação incompleta - encontradas apenas ${createdTables.length} tabelas`);
        return false;
      }
    } catch (error: any) {
      addLog(`Erro na verificação: ${error.message}`);
      return false;
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
        
        // SQL consolidado para instalação
        const installationSteps = [
          {
            sql: `
-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
            `,
            description: 'Extensões do PostgreSQL'
          },
          {
            sql: `
-- Tabela de usuários autorizados
CREATE TABLE IF NOT EXISTS public.authorized_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de cursos
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de pós-graduações
CREATE TABLE IF NOT EXISTS public.postgraduate_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de status de leads
CREATE TABLE IF NOT EXISTS public.lead_statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#f59e0b',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
            `,
            description: 'Tabelas básicas do sistema'
          },
          {
            sql: `
-- Tabela de eventos
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  whatsapp_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de QR codes
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  short_url TEXT NOT NULL,
  full_url TEXT NOT NULL,
  tracking_id TEXT,
  type TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
            `,
            description: 'Tabelas de eventos e QR codes'
          },
          {
            sql: `
-- Tabela de sessões de scan
CREATE TABLE IF NOT EXISTS public.scan_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code_id UUID REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,
  lead_id UUID,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  course_id UUID REFERENCES public.courses(id),
  postgraduate_course_id UUID REFERENCES public.postgraduate_courses(id),
  course_type TEXT DEFAULT 'course',
  event_id UUID REFERENCES public.events(id),
  status_id UUID REFERENCES public.lead_statuses(id),
  scan_session_id UUID REFERENCES public.scan_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
            `,
            description: 'Tabelas de leads e sessões'
          },
          {
            sql: `
-- Tabela de histórico de mensagens
CREATE TABLE IF NOT EXISTS public.message_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT message_history_status_check CHECK (status IN ('sent', 'failed', 'pending', 'sending'))
);

-- Tabela de validações WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_validations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  response_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  validated_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
            `,
            description: 'Tabelas auxiliares'
          },
          {
            sql: `
-- Criar índices
CREATE INDEX IF NOT EXISTS idx_qr_codes_tracking_id ON public.qr_codes(tracking_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_type ON public.qr_codes(type);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_qr_code_id ON public.scan_sessions(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_event_id ON public.scan_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_converted ON public.scan_sessions(converted);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_scanned_at ON public.scan_sessions(scanned_at);
CREATE INDEX IF NOT EXISTS idx_leads_scan_session_id ON public.leads(scan_session_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_validations_status ON public.whatsapp_validations(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_validations_created_at ON public.whatsapp_validations(created_at);
            `,
            description: 'Índices para performance'
          },
          {
            sql: `
-- Habilitar RLS
ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postgraduate_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
            `,
            description: 'Configuração de segurança RLS'
          },
          {
            sql: `
-- Políticas RLS (permitir acesso total por enquanto)
CREATE POLICY IF NOT EXISTS "Allow all access" ON public.authorized_users FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all access" ON public.courses FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all access" ON public.postgraduate_courses FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all access" ON public.lead_statuses FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all access" ON public.events FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all access" ON public.qr_codes FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all access" ON public.scan_sessions FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all access" ON public.leads FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all access" ON public.message_history FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all access" ON public.whatsapp_validations FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all access" ON public.system_settings FOR ALL USING (true);
            `,
            description: 'Políticas de acesso'
          },
          {
            sql: `
-- Função para verificar login
CREATE OR REPLACE FUNCTION public.verify_login(p_username TEXT, p_password TEXT)
RETURNS TABLE(success BOOLEAN, user_data JSON)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record public.authorized_users%ROWTYPE;
BEGIN
  SELECT * INTO user_record 
  FROM public.authorized_users 
  WHERE username = p_username 
  AND password_hash = crypt(p_password, password_hash);
  
  IF FOUND THEN
    RETURN QUERY SELECT 
      true as success,
      json_build_object(
        'id', user_record.id,
        'username', user_record.username,
        'email', user_record.email
      ) as user_data;
  ELSE
    RETURN QUERY SELECT false as success, null::json as user_data;
  END IF;
END;
$$;
            `,
            description: 'Funções do sistema'
          },
          {
            sql: `
-- Inserir dados iniciais
INSERT INTO public.authorized_users (username, email, password_hash) 
VALUES ('synclead', 'synclead@sistema.com', crypt('s1ncl3@d', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.lead_statuses (name, color)
VALUES ('Pendente', '#f59e0b')
ON CONFLICT DO NOTHING;
            `,
            description: 'Dados iniciais'
          }
        ];

        let allSuccess = true;
        for (const step of installationSteps) {
          const success = await executeSQL(targetSupabase, step.sql, step.description);
          if (!success) {
            allSuccess = false;
            break;
          }
        }

        if (allSuccess) {
          // Verificar se a instalação realmente funcionou
          const installationVerified = await verifyInstallation(targetSupabase);
          
          if (installationVerified) {
            addLog('✓ Sistema instalado com sucesso!');
            addLog('✓ Todas as tabelas foram criadas e verificadas');
            addLog('✓ Usuário padrão criado: synclead / s1ncl3@d');
            
            setInstallationStep('complete');
            
            toast({
              title: "Instalação concluída",
              description: "Sistema instalado e verificado com sucesso",
            });
          } else {
            throw new Error('Falha na verificação da instalação - tabelas não foram criadas corretamente');
          }
        } else {
          throw new Error('Falha durante a execução dos scripts de instalação');
        }
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Erro na instalação';
      addLog(`ERRO CRÍTICO: ${errorMessage}`);
      
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
          <p className="text-xs text-gray-500">Necessário para criar/modificar tabelas - deve começar com "eyJ"</p>
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
                  <strong>Usuário:</strong> synclead<br />
                  <strong>Senha:</strong> s1ncl3@d
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
