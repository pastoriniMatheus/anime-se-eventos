
-- ====================================================================
-- ESTRUTURA COMPLETA DO BANCO DE DADOS
-- Consolidado de todas as migrações existentes
-- Apenas estrutura - sem dados
-- ====================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- TABELAS PRINCIPAIS
-- ====================================================================

-- Tabela de cursos
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de pós-graduações
CREATE TABLE public.postgraduate_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de status de leads
CREATE TABLE public.lead_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#64748b',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de eventos
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  whatsapp_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de QR codes
CREATE TABLE public.qr_codes (
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
CREATE TABLE public.scan_sessions (
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
CREATE TABLE public.leads (
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
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'email', 'sms')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de mensagens
CREATE TABLE public.message_history (
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
CREATE TABLE public.message_recipients (
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
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de validações de WhatsApp
CREATE TABLE public.whatsapp_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  response_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validated_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de usuários autorizados
CREATE TABLE public.authorized_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ====================================================================
-- FOREIGN KEYS ADICIONAIS
-- ====================================================================

-- Adicionar foreign key de leads para scan_sessions
ALTER TABLE public.scan_sessions 
ADD CONSTRAINT scan_sessions_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;

-- ====================================================================
-- ÍNDICES
-- ====================================================================

-- Índices para QR codes
CREATE INDEX idx_qr_codes_tracking_id ON public.qr_codes(tracking_id);
CREATE INDEX idx_qr_codes_type ON public.qr_codes(type);

-- Índices para scan sessions
CREATE INDEX idx_scan_sessions_qr_code_id ON public.scan_sessions(qr_code_id);
CREATE INDEX idx_scan_sessions_event_id ON public.scan_sessions(event_id);
CREATE INDEX idx_scan_sessions_converted ON public.scan_sessions(converted);
CREATE INDEX idx_scan_sessions_scanned_at ON public.scan_sessions(scanned_at);

-- Índices para leads
CREATE INDEX idx_leads_scan_session_id ON public.leads(scan_session_id);

-- Índices para validações de WhatsApp
CREATE INDEX idx_whatsapp_validations_status ON public.whatsapp_validations(status);
CREATE INDEX idx_whatsapp_validations_created_at ON public.whatsapp_validations(created_at);

-- Índices para destinatários de mensagem
CREATE INDEX idx_message_recipients_message_history_id ON public.message_recipients(message_history_id);
CREATE INDEX idx_message_recipients_lead_id ON public.message_recipients(lead_id);
CREATE INDEX idx_message_recipients_delivery_status ON public.message_recipients(delivery_status);
CREATE INDEX idx_message_history_delivery_code ON public.message_history(delivery_code);

-- ====================================================================
-- FUNÇÕES
-- ====================================================================

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

-- ====================================================================
-- TRIGGERS
-- ====================================================================

-- Triggers para atualizar updated_at
CREATE TRIGGER update_leads_updated_at 
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at 
BEFORE UPDATE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================================================

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

-- ====================================================================
-- POLÍTICAS RLS
-- ====================================================================

-- Políticas para permitir acesso público (temporário)
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
CREATE POLICY "Allow all access" ON public.whatsapp_validations FOR ALL USING (true);

-- Política específica para scan_sessions
CREATE POLICY "Allow all access to scan_sessions" 
ON public.scan_sessions 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Política específica para authorized_users
CREATE POLICY "Allow login verification" 
ON public.authorized_users
FOR SELECT USING (true);

-- ====================================================================
-- FIM DA ESTRUTURA
-- ====================================================================
