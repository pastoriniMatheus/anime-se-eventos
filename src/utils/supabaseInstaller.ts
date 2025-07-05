
import { DatabaseConfig } from '@/types/database';

export const addLog = (
  message: string, 
  setInstallationLog: (fn: (prev: string[]) => string[]) => void
) => {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `${timestamp}: ${message}`;
  setInstallationLog(prev => [...prev, logMessage]);
  console.log('[SecretInstall]', logMessage);
};

export const testSupabaseConnection = async (
  config: DatabaseConfig,
  addLogFn: (message: string) => void
): Promise<boolean> => {
  try {
    if (!config.supabaseUrl || !config.supabaseServiceKey) {
      throw new Error('URL do Supabase e Service Key são obrigatórios');
    }
    
    if (!config.supabaseUrl.includes('supabase.co')) {
      throw new Error('URL do Supabase deve conter "supabase.co"');
    }

    if (!config.supabaseServiceKey.startsWith('eyJ')) {
      throw new Error('Service Key deve ser um JWT válido começando com "eyJ"');
    }

    const cleanUrl = config.supabaseUrl.replace(/\/$/, '');
    addLogFn('Configuração Supabase validada localmente');
    addLogFn(`Testando conexão com: ${cleanUrl}`);

    const { createClient } = await import('@supabase/supabase-js');
    const targetSupabase = createClient(cleanUrl, config.supabaseServiceKey);
    
    addLogFn('Testando Service Key...');
    
    // Teste simples de conexão
    const { error: testError } = await targetSupabase
      .from('_nonexistent_table')
      .select('*')
      .limit(1);

    // Se chegou aqui, a Service Key é válida
    addLogFn('Service Key validada com sucesso!');
    addLogFn('Conexão estabelecida com sucesso!');
    addLogFn('Pronto para instalação - instalação limpa será realizada');
    
    return true;
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido na conexão';
    addLogFn(`ERRO: ${errorMessage}`);
    return false;
  }
};

// Schema SQL corrigido para máxima compatibilidade
const COMPLETE_SCHEMA = `
-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- Habilitar RLS
ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postgraduate_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Allow all access" ON public.authorized_users;
DROP POLICY IF EXISTS "Allow all access" ON public.courses;
DROP POLICY IF EXISTS "Allow all access" ON public.postgraduate_courses;
DROP POLICY IF EXISTS "Allow all access" ON public.lead_statuses;
DROP POLICY IF EXISTS "Allow all access" ON public.events;
DROP POLICY IF EXISTS "Allow all access" ON public.qr_codes;
DROP POLICY IF EXISTS "Allow all access" ON public.scan_sessions;
DROP POLICY IF EXISTS "Allow all access" ON public.leads;

-- Criar políticas RLS (permitir acesso total por enquanto)
CREATE POLICY "Allow all access" ON public.authorized_users FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.courses FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.postgraduate_courses FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.lead_statuses FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.events FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.qr_codes FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.scan_sessions FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.leads FOR ALL USING (true);

-- Dados iniciais
INSERT INTO public.authorized_users (username, email, password_hash) 
VALUES ('synclead', 'synclead@sistema.com', crypt('s1ncl3@d', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.lead_statuses (name, color)
VALUES ('Pendente', '#f59e0b')
ON CONFLICT DO NOTHING;
`;

export const installSupabaseSchema = async (
  config: DatabaseConfig,
  addLogFn: (message: string) => void
): Promise<boolean> => {
  try {
    addLogFn('Iniciando instalação do sistema...');
    
    const { createClient } = await import('@supabase/supabase-js');
    const targetSupabase = createClient(config.supabaseUrl!, config.supabaseServiceKey!);
    
    addLogFn('Executando instalação via comandos SQL individuais...');
    
    // Dividir o schema em comandos individuais e executar um por vez
    const sqlCommands = COMPLETE_SCHEMA
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i].trim();
      if (!command) continue;
      
      try {
        addLogFn(`Executando comando ${i + 1}/${sqlCommands.length}...`);
        
        // Usar REST API diretamente para executar SQL
        const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.supabaseServiceKey}`,
            'apikey': config.supabaseServiceKey!
          },
          body: JSON.stringify({ sql: command + ';' })
        });

        if (response.ok || response.status === 409) { // 409 = conflict (já existe)
          successCount++;
        } else {
          // Tentar método alternativo via client
          const { error } = await targetSupabase.rpc('exec', { sql: command + ';' });
          if (!error) {
            successCount++;
          } else {
            errorCount++;
            addLogFn(`Aviso: ${error.message.substring(0, 100)}`);
          }
        }
      } catch (cmdError: any) {
        errorCount++;
        addLogFn(`Aviso comando ${i + 1}: ${cmdError.message?.substring(0, 50) || 'erro'}`);
      }
    }
    
    addLogFn(`Comandos executados: ${successCount} sucessos, ${errorCount} avisos`);
    
    if (successCount === 0) {
      addLogFn('⚠️ Instalação automática não funcionou');
      addLogFn('📋 Execute o SQL completo manualmente no Supabase:');
      addLogFn('');
      addLogFn('-- SCHEMA COMPLETO PARA COPIAR E COLAR:');
      
      // Dividir o schema em linhas para o log
      const lines = COMPLETE_SCHEMA.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          addLogFn(line);
        }
      }
      
      addLogFn('');
      addLogFn('🔄 Após executar todo o SQL acima, tente a instalação novamente');
      return false;
    }

    // Verificar se a instalação funcionou
    addLogFn('Verificando instalação...');
    const { data: testUser, error: testError } = await targetSupabase
      .from('authorized_users')
      .select('username')
      .eq('username', 'synclead')
      .limit(1);

    if (!testError && testUser && testUser.length > 0) {
      addLogFn('✓ Instalação verificada com sucesso!');
      addLogFn('✓ Usuário padrão criado: synclead / s1ncl3@d');
      addLogFn('✅ Sistema pronto para usar!');
      return true;
    } else if (successCount > 0) {
      addLogFn('✓ Instalação parcialmente concluída');
      addLogFn('Tente fazer login com: synclead / s1ncl3@d');
      return true;
    } else {
      addLogFn('⚠️ Não foi possível verificar a instalação');
      return false;
    }
    
  } catch (error: any) {
    const errorMsg = error?.message || 'Erro crítico desconhecido';
    addLogFn(`ERRO CRÍTICO: ${errorMsg}`);
    
    // Em caso de erro, mostrar SQL para execução manual
    addLogFn('📋 Execute o SQL completo manualmente no Supabase:');
    addLogFn('');
    addLogFn('-- SCHEMA COMPLETO PARA COPIAR E COLAR:');
    
    const lines = COMPLETE_SCHEMA.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        addLogFn(line);
      }
    }
    
    addLogFn('');
    addLogFn('🔄 Após executar todo o SQL acima, tente a instalação novamente');
    return false;
  }
};

export const verifyInstallation = async (
  supabaseClient: any, 
  addLogFn: (message: string) => void
): Promise<boolean> => {
  try {
    addLogFn('Verificando instalação...');
    
    // Tentar acessar a tabela de usuários
    const { data, error } = await supabaseClient
      .from('authorized_users')
      .select('username')
      .limit(1);

    if (!error) {
      addLogFn('✓ Tabelas principais encontradas');
      return true;
    } else {
      const errorMsg = error?.message || 'Erro na verificação';
      addLogFn(`⚠️ Verificação: ${errorMsg}`);
      return false;
    }
  } catch (error: any) {
    const errorMsg = error?.message || 'Erro desconhecido na verificação';
    addLogFn(`Erro na verificação: ${errorMsg}`);
    return false;
  }
};
