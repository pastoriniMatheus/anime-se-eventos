
-- SyncLead System Database Schema
-- Versão completa com todas as tabelas e funcionalidades

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- SYSTEM SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- AUTHORIZED USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.authorized_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- LEAD STATUS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.lead_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#f59e0b',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- COURSES TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.postgraduate_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  whatsapp_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- QR CODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  short_url TEXT NOT NULL,
  full_url TEXT NOT NULL,
  original_url TEXT,
  tracking_id TEXT,
  type TEXT DEFAULT 'whatsapp',
  scans INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- SCAN SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.scan_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code_id UUID REFERENCES public.qr_codes(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  lead_id UUID,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  postgraduate_course_id UUID REFERENCES public.postgraduate_courses(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  status_id UUID REFERENCES public.lead_statuses(id) ON DELETE SET NULL,
  scan_session_id UUID REFERENCES public.scan_sessions(id) ON DELETE SET NULL,
  course_type TEXT DEFAULT 'course',
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- MESSAGE SYSTEM TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.message_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  filter_type TEXT,
  filter_value TEXT,
  recipients_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivery_code TEXT UNIQUE DEFAULT CONCAT('MSG-', EXTRACT(EPOCH FROM now())::bigint, '-', SUBSTRING(gen_random_uuid()::text, 1, 8)),
  webhook_response TEXT
);

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

-- ============================================
-- WHATSAPP VALIDATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.whatsapp_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  response_message TEXT,
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON public.leads(whatsapp);
CREATE INDEX IF NOT EXISTS idx_leads_course_id ON public.leads(course_id);
CREATE INDEX IF NOT EXISTS idx_leads_event_id ON public.leads(event_id);
CREATE INDEX IF NOT EXISTS idx_leads_status_id ON public.leads(status_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_message_recipients_message_history_id ON public.message_recipients(message_history_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_lead_id ON public.message_recipients(lead_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_delivery_status ON public.message_recipients(delivery_status);
CREATE INDEX IF NOT EXISTS idx_message_history_delivery_code ON public.message_history(delivery_code);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_qr_code_id ON public.scan_sessions(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_event_id ON public.scan_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_tracking_id ON public.qr_codes(tracking_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to system_settings" ON public.system_settings FOR ALL USING (true);

ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access" ON public.authorized_users FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow login verification" ON public.authorized_users FOR SELECT USING (true);

ALTER TABLE public.lead_statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access" ON public.lead_statuses FOR ALL USING (true);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access" ON public.courses FOR ALL USING (true);

ALTER TABLE public.postgraduate_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access" ON public.postgraduate_courses FOR ALL USING (true);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access" ON public.events FOR ALL USING (true);

ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access" ON public.qr_codes FOR ALL USING (true);

ALTER TABLE public.scan_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to scan_sessions" ON public.scan_sessions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access" ON public.leads FOR ALL USING (true);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access" ON public.message_templates FOR ALL USING (true);

ALTER TABLE public.message_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access" ON public.message_history FOR ALL USING (true);

ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to message_recipients" ON public.message_recipients FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Function to increment QR scan count
CREATE OR REPLACE FUNCTION public.increment_qr_scan(tracking_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.qr_codes 
  SET scans = scans + 1 
  WHERE tracking_id = increment_qr_scan.tracking_id;
END;
$$;

-- Function to get scan sessions with related data
CREATE OR REPLACE FUNCTION public.get_scan_sessions()
RETURNS TABLE(
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
)
LANGUAGE plpgsql
AS $$
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
    CASE 
      WHEN qr.id IS NOT NULL THEN 
        json_build_object(
          'id', qr.id,
          'short_url', qr.short_url,
          'type', qr.type,
          'scans', qr.scans,
          'tracking_id', qr.tracking_id
        )
      ELSE NULL
    END as qr_code,
    CASE 
      WHEN e.id IS NOT NULL THEN 
        json_build_object(
          'id', e.id,
          'name', e.name,
          'whatsapp_number', e.whatsapp_number
        )
      ELSE NULL
    END as event,
    CASE 
      WHEN l.id IS NOT NULL THEN 
        json_build_object(
          'id', l.id,
          'name', l.name,
          'email', l.email,
          'whatsapp', l.whatsapp
        )
      ELSE NULL
    END as lead
  FROM scan_sessions ss
  LEFT JOIN qr_codes qr ON ss.qr_code_id = qr.id
  LEFT JOIN events e ON ss.event_id = e.id
  LEFT JOIN leads l ON ss.lead_id = l.id
  ORDER BY ss.scanned_at DESC;
END;
$$;

-- Function to confirm message delivery
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

-- Function to verify user login
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
      true,
      json_build_object(
        'id', user_record.id,
        'username', user_record.username,
        'email', user_record.email
      );
  ELSE
    RETURN QUERY SELECT false, null::json;
  END IF;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_authorized_users_updated_at BEFORE UPDATE ON public.authorized_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default lead status
INSERT INTO public.lead_statuses (name, color) 
VALUES ('Novo Lead', '#3b82f6') 
ON CONFLICT DO NOTHING;

-- Insert default user (username: synclead, password: s1ncl3@d)
INSERT INTO public.authorized_users (username, email, password_hash) 
VALUES ('synclead', 'admin@synclead.com', crypt('s1ncl3@d', gen_salt('bf'))) 
ON CONFLICT (username) DO NOTHING;

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
('site_title', 'SyncLead', 'Título do site'),
('primary_color', '#3b82f6', 'Cor primária do sistema'),
('course_nomenclature', 'Cursos', 'Nome usado para cursos'),
('postgraduate_nomenclature', 'Pós-graduação', 'Nome usado para pós-graduação')
ON CONFLICT (key) DO NOTHING;
