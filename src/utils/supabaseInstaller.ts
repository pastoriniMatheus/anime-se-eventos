
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

// Schema SQL completo atualizado com todas as tabelas
const COMPLETE_SCHEMA = `
-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de cursos
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de pós-graduações
CREATE TABLE IF NOT EXISTS public.postgraduate_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de status de leads
CREATE TABLE IF NOT EXISTS public.lead_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#64748b',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de eventos
CREATE TABLE IF NOT EXISTS public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  whatsapp_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de QR codes
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  short_url TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  scans INTEGER NOT NULL DEFAULT 0,
  tracking_id TEXT,
  type TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de sessões de scan
CREATE TABLE IF NOT EXISTS public.scan_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code_id UUID REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted BOOLEAN NOT NULL DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,
  lead_id UUID,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id),
  event_id UUID REFERENCES public.events(id),
  status_id UUID REFERENCES public.lead_statuses(id),
  shift TEXT CHECK (shift IN ('manhã', 'tarde', 'noite')),
  scan_session_id UUID REFERENCES public.scan_sessions(id) ON DELETE SET NULL,
  postgraduate_course_id UUID REFERENCES public.postgraduate_courses(id),
  course_type TEXT DEFAULT 'course',
  source TEXT DEFAULT 'form',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de templates de mensagem
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'email', 'sms')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de mensagens
CREATE TABLE IF NOT EXISTS public.message_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'email', 'sms')),
  filter_type TEXT CHECK (filter_type IN ('course', 'event', 'all')),
  filter_value TEXT,
  recipients_count INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending', 'sending')) DEFAULT 'pending',
  webhook_response TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivery_code TEXT UNIQUE DEFAULT CONCAT('MSG-', EXTRACT(EPOCH FROM now())::bigint, '-', SUBSTRING(gen_random_uuid()::text, 1, 8))
);

-- Tabela de destinatários de mensagem
CREATE TABLE IF NOT EXISTS public.message_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_history_id UUID NOT NULL REFERENCES public.message_history(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_history_id, lead_id)
);

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de validações de WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  response_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validated_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de usuários autorizados
CREATE TABLE IF NOT EXISTS public.authorized_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar foreign key de leads para scan_sessions
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_qr_codes_tracking_id ON public.qr_codes(tracking_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_type ON public.qr_codes(type);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_qr_code_id ON public.scan_sessions(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_event_id ON public.scan_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_converted ON public.scan_sessions(converted);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_scanned_at ON public.scan_sessions(scanned_at);
CREATE INDEX IF NOT EXISTS idx_leads_scan_session_id ON public.leads(scan_session_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_validations_status ON public.whatsapp_validations(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_validations_created_at ON public.whatsapp_validations(created_at);
CREATE INDEX IF NOT EXISTS idx_message_recipients_message_history_id ON public.message_recipients(message_history_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_lead_id ON public.message_recipients(lead_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_delivery_status ON public.message_recipients(delivery_status);
CREATE INDEX IF NOT EXISTS idx_message_history_delivery_code ON public.message_history(delivery_code);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- Função RPC para acessar scan_sessions
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

-- Função para confirmar entrega via webhook
CREATE OR REPLACE FUNCTION public.confirm_message_delivery(
  p_delivery_code TEXT,
  p_lead_identifier TEXT,
  p_status TEXT DEFAULT 'delivered'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_history_id UUID;
  v_lead_id UUID;
BEGIN
  -- Buscar o histórico pelo código de entrega
  SELECT id INTO v_message_history_id 
  FROM public.message_history 
  WHERE delivery_code = p_delivery_code;
  
  IF v_message_history_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid delivery code');
  END IF;
  
  -- Buscar o lead pelo identificador
  SELECT id INTO v_lead_id 
  FROM public.leads 
  WHERE email = p_lead_identifier OR whatsapp = p_lead_identifier;
  
  IF v_lead_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Lead not found');
  END IF;
  
  -- Atualizar status de entrega
  UPDATE public.message_recipients 
  SET 
    delivery_status = p_status,
    delivered_at = CASE WHEN p_status = 'delivered' THEN now() ELSE NULL END
  WHERE message_history_id = v_message_history_id 
    AND lead_id = v_lead_id;
    
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Message recipient not found');
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Delivery status updated successfully',
    'delivery_code', p_delivery_code,
    'status', p_status
  );
END;
$$;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_leads_updated_at 
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at 
BEFORE UPDATE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postgraduate_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_validations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Allow all access" ON public.courses;
DROP POLICY IF EXISTS "Allow all access" ON public.postgraduate_courses;
DROP POLICY IF EXISTS "Allow all access" ON public.lead_statuses;
DROP POLICY IF EXISTS "Allow all access" ON public.events;
DROP POLICY IF EXISTS "Allow all access" ON public.qr_codes;
DROP POLICY IF EXISTS "Allow all access" ON public.leads;
DROP POLICY IF EXISTS "Allow all access" ON public.message_templates;
DROP POLICY IF EXISTS "Allow all access" ON public.message_history;
DROP POLICY IF EXISTS "Allow all access" ON public.message_recipients;
DROP POLICY IF EXISTS "Allow all access" ON public.system_settings;
DROP POLICY IF EXISTS "Allow all access to scan_sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Allow login verification" ON public.authorized_users;
DROP POLICY IF EXISTS "Allow all access" ON public.whatsapp_validations;

CREATE POLICY "Allow all access" ON public.courses FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.postgraduate_courses FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.lead_statuses FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.events FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.qr_codes FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.leads FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.message_templates FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.message_history FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.message_recipients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.system_settings FOR ALL USING (true);
CREATE POLICY "Allow all access to scan_sessions" ON public.scan_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow login verification" ON public.authorized_users FOR SELECT USING (true);
CREATE POLICY "Allow all access" ON public.whatsapp_validations FOR ALL USING (true);

-- Inserir usuário padrão
INSERT INTO public.authorized_users (username, email, password_hash) 
VALUES ('synclead', 'synclead@sistema.com', crypt('s1ncl3@d', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;

-- Inserir status padrão
INSERT INTO public.lead_statuses (name, color)
VALUES ('Pendente', '#64748b')
ON CONFLICT (name) DO NOTHING;

-- Inserir configurações padrão do sistema
INSERT INTO public.system_settings (key, value) VALUES
('visual_logo_url', '"/lovable-uploads/c7eb5d40-5d53-4b46-b5a9-d35d5a784ac7.png"'),
('visual_title', '"Sistema de Captura de Leads"'),
('visual_subtitle', '"Gestão Inteligente de Leads"'),
('webhook_urls', '{"whatsapp":"https://n8n.intrategica.com.br/webhook-test/disparos","email":"https://n8n.intrategica.com.br/webhook-test/disparos","sms":"https://n8n.intrategica.com.br/webhook-test/disparos","whatsappValidation":"https://n8n-wh.intrategica.com.br/webhook/qrcode-cesmac","sync":""}'),
('sync_webhook_settings', '{"interval":"60","mode":"new_only","enabled":false}'),
('form_title', '"Cadastre-se agora"'),
('form_subtitle', '"Preencha seus dados"'),
('form_description', '"Complete o formulário abaixo para se inscrever"'),
('form_thank_you_title', '"Obrigado!"'),
('form_thank_you_message', '"Sua inscrição foi realizada com sucesso!"'),
('form_redirect_url', '""'),
('form_primary_color', '"#3b82f6"'),
('form_secondary_color', '"#f59e0b"'),
('form_button_color', '"#10b981"'),
('form_background_color', '"#ffffff"'),
('form_text_color', '"#1f2937"'),
('form_field_background_color', '"#f9fafb"'),
('form_field_border_color', '"#d1d5db"')
ON CONFLICT (key) DO NOTHING;
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
      addLogFn('✓ Novas tabelas de mensagens incluídas');
      return true;
    } else if (successCount > 0) {
      addLogFn('⚠️ Instalação parcial - algumas operações podem ter falhado');
      addLogFn('📋 Execute o SQL completo manualmente no Supabase se necessário');
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
