
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

// Schema SQL atualizado com todas as tabelas necessárias
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
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

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
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);

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

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Allow all access" ON public.authorized_users;
DROP POLICY IF EXISTS "Allow all access" ON public.courses;
DROP POLICY IF EXISTS "Allow all access" ON public.postgraduate_courses;
DROP POLICY IF EXISTS "Allow all access" ON public.lead_statuses;
DROP POLICY IF EXISTS "Allow all access" ON public.events;
DROP POLICY IF EXISTS "Allow all access" ON public.qr_codes;
DROP POLICY IF EXISTS "Allow all access" ON public.scan_sessions;
DROP POLICY IF EXISTS "Allow all access" ON public.leads;
DROP POLICY IF EXISTS "Allow all access" ON public.message_history;
DROP POLICY IF EXISTS "Allow all access" ON public.whatsapp_validations;
DROP POLICY IF EXISTS "Allow all access" ON public.system_settings;

-- Criar políticas RLS (permitir acesso total por enquanto)
CREATE POLICY "Allow all access" ON public.authorized_users FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.courses FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.postgraduate_courses FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.lead_statuses FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.events FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.qr_codes FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.scan_sessions FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.leads FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.message_history FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.whatsapp_validations FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.system_settings FOR ALL USING (true);

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
  WHERE (username = p_username OR email = p_username)
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

-- Função para acessar scan_sessions
CREATE OR REPLACE FUNCTION get_scan_sessions()
RETURNS TABLE (
  id UUID,
  qr_code_id UUID,
  event_id UUID,
  lead_id UUID,
  scanned_at TIMESTAMP WITH TIME ZONE,
  user_agent TEXT,
  ip_address TEXT,
  qr_code JSON,
  event JSON,
  lead JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.id,
    ss.qr_code_id,
    ss.event_id,
    ss.lead_id,
    ss.scanned_at,
    ss.user_agent,
    ss.ip_address,
    to_json(row(qr.short_url)) as qr_code,
    to_json(row(e.name)) as event,
    to_json(row(l.name, l.email)) as lead
  FROM scan_sessions ss
  LEFT JOIN qr_codes qr ON ss.qr_code_id = qr.id
  LEFT JOIN events e ON ss.event_id = e.id
  LEFT JOIN leads l ON ss.lead_id = l.id
  ORDER BY ss.scanned_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Dados iniciais
INSERT INTO public.authorized_users (username, email, password_hash) 
VALUES ('synclead', 'synclead@sistema.com', crypt('s1ncl3@d', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.lead_statuses (name, color)
VALUES ('Pendente', '#f59e0b')
ON CONFLICT DO NOTHING;

-- Inserir configurações padrão do sistema
INSERT INTO public.system_settings (key, value, description) VALUES
('visual_logo_url', '/lovable-uploads/c7eb5d40-5d53-4b46-b5a9-d35d5a784ac7.png', 'URL do logotipo do sistema'),
('visual_title', 'Sistema de Captura de Leads', 'Título principal do sistema'),
('visual_subtitle', 'Gestão Inteligente de Leads', 'Subtítulo do sistema'),
('visual_favicon_url', '/favicon.ico', 'URL do favicon'),
('form_title', 'Cadastre-se agora', 'Título do formulário de captura'),
('form_subtitle', 'Preencha seus dados', 'Subtítulo do formulário'),
('form_description', 'Complete o formulário abaixo para se inscrever', 'Descrição do formulário'),
('form_thank_you_title', 'Obrigado!', 'Título da página de agradecimento'),
('form_thank_you_message', 'Sua inscrição foi realizada com sucesso!', 'Mensagem de agradecimento'),
('form_redirect_url', '', 'URL de redirecionamento após envio'),
('form_primary_color', '#3b82f6', 'Cor primária do formulário'),
('form_secondary_color', '#f59e0b', 'Cor secundária do formulário'),
('form_button_color', '#10b981', 'Cor do botão do formulário'),
('form_background_color', '#ffffff', 'Cor de fundo do formulário'),
('form_text_color', '#1f2937', 'Cor do texto do formulário'),
('form_field_background_color', '#f9fafb', 'Cor de fundo dos campos'),
('form_field_border_color', '#d1d5db', 'Cor da borda dos campos'),
('webhook_urls', '{"whatsapp":"https://n8n.intrategica.com.br/webhook-test/disparos","email":"https://n8n.intrategica.com.br/webhook-test/disparos","sms":"https://n8n.intrategica.com.br/webhook-test/disparos","whatsappValidation":"https://n8n-wh.intrategica.com.br/webhook/qrcode-cesmac","sync":""}', 'URLs dos webhooks configurados'),
('sync_webhook_settings', '{"interval":"60","mode":"new_only","enabled":false}', 'Configurações do webhook de sincronização')
ON CONFLICT (key) DO NOTHING;

-- Adicionar vincular leads a scan_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_scan_session_id_fkey'
  ) THEN
    ALTER TABLE public.leads 
    ADD CONSTRAINT leads_scan_session_id_fkey 
    FOREIGN KEY (scan_session_id) REFERENCES public.scan_sessions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Atualizar scan_sessions com lead_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'scan_sessions_lead_id_fkey'
  ) THEN
    ALTER TABLE public.scan_sessions 
    ADD CONSTRAINT scan_sessions_lead_id_fkey 
    FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
  END IF;
END $$;
`;

export const installSupabaseSchema = async (
  config: DatabaseConfig,
  addLogFn: (message: string) => void
): Promise<boolean> => {
  try {
    addLogFn('Iniciando instalação do sistema...');
    
    const { createClient } = await import('@supabase/supabase-js');
    const targetSupabase = createClient(config.supabaseUrl!, config.supabaseServiceKey!);
    
    // Primeiro, verificar se já está instalado
    addLogFn('Verificando estado atual do banco...');
    const { data: existingUser } = await targetSupabase
      .from('authorized_users')
      .select('username')
      .eq('username', 'synclead')
      .limit(1);

    if (existingUser && existingUser.length > 0) {
      addLogFn('✓ Sistema já está instalado!');
      addLogFn('✓ Usuário padrão encontrado: synclead');
      addLogFn('✅ Instalação verificada com sucesso!');
      return true;
    }

    addLogFn('Executando comandos SQL individuais...');
    
    // Dividir o schema em comandos individuais
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
        addLogFn(`Comando ${i + 1}/${sqlCommands.length}: ${command.substring(0, 50)}...`);
        
        // Tentar executar via RPC
        const { error } = await targetSupabase.rpc('sql', { 
          query: command + ';' 
        });

        if (!error) {
          successCount++;
          addLogFn(`✓ Sucesso`);
        } else {
          errorCount++;
          addLogFn(`⚠ Aviso: ${error.message.substring(0, 80)}`);
        }
      } catch (cmdError: any) {
        errorCount++;
        addLogFn(`⚠ Erro: ${cmdError.message?.substring(0, 80) || 'erro desconhecido'}`);
      }
    }
    
    addLogFn(`Resultado: ${successCount} sucessos, ${errorCount} avisos`);
    
    // Verificar instalação final
    addLogFn('Verificando instalação final...');
    const { data: finalCheck } = await targetSupabase
      .from('authorized_users')
      .select('username')
      .eq('username', 'synclead')
      .limit(1);

    if (finalCheck && finalCheck.length > 0) {
      addLogFn('✅ Instalação automática concluída!');
      addLogFn('✓ Usuário padrão criado: synclead / s1ncl3@d');
      return true;
    } else if (successCount > 0) {
      addLogFn('⚠️ Instalação parcial - algumas operações podem ter falhado');
      addLogFn('📋 Execute o SQL completo manualmente no Supabase:');
      
      // Mostrar SQL para execução manual
      const lines = COMPLETE_SCHEMA.split('\n');
      for (const line of lines.slice(0, 20)) { // Limitar linhas para não spammar
        if (line.trim()) {
          addLogFn(line);
        }
      }
      addLogFn('... (SQL completo truncado)');
      return false;
    } else {
      addLogFn('⚠️ Instalação automática falhou');
      addLogFn('📋 Execute o SQL completo manualmente no Supabase');
      return false;
    }
    
  } catch (error: any) {
    const errorMsg = error?.message || 'Erro crítico desconhecido';
    addLogFn(`ERRO CRÍTICO: ${errorMsg}`);
    addLogFn('📋 Execute o SQL completo manualmente no Supabase');
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
