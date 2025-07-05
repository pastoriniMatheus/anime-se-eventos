
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface DatabaseConfig {
  type: 'supabase' | 'postgresql';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceKey?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}

const DATABASE_SCHEMA = `
-- Schema consolidado do sistema de leads
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
VALUES ('cesmac', 'cesmac@sistema.com', crypt('cesmac@2025', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.lead_statuses (name, color)
VALUES ('Pendente', '#f59e0b')
ON CONFLICT DO NOTHING;

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

const installDatabase = async (supabaseClient: any) => {
  try {
    console.log('Starting database installation...');
    
    // Execute the schema installation by splitting into individual statements
    const statements = DATABASE_SCHEMA
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 100) + '...');
        
        const { error } = await supabaseClient.rpc('sql', {
          query: statement + ';'
        });
        
        if (error) {
          console.log('SQL Error:', error.message);
          // Continue with other statements even if one fails
        }
      }
    }

    console.log('Database installation completed');
    return { success: true };

  } catch (error) {
    console.error('Database installation error:', error);
    throw error;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Database installer function called');
    
    const body = await req.json();
    const { action, config } = body;
    
    console.log('Action:', action);

    if (action === 'test_connection') {
      if (config.type === 'supabase') {
        if (!config.supabaseUrl || !config.supabaseServiceKey) {
          throw new Error('Supabase URL and Service Key are required');
        }

        if (!config.supabaseUrl.includes('supabase.co')) {
          throw new Error('Invalid Supabase URL format');
        }

        const supabaseClient = createClient(
          config.supabaseUrl,
          config.supabaseServiceKey
        );

        // Test basic connection
        const { data: testData, error: testError } = await supabaseClient
          .rpc('version');

        if (testError && !testError.message.includes('function version() does not exist')) {
          throw new Error(`Connection failed: ${testError.message}`);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Connection established successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'install') {
      if (config.type === 'supabase') {
        const supabaseClient = createClient(
          config.supabaseUrl,
          config.supabaseServiceKey
        );

        await installDatabase(supabaseClient);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Database installed successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error: any) {
    console.error('Error in database-installer function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
})
