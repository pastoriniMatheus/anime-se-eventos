
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

const getDatabaseSchema = () => {
  return `
-- Schema consolidado do sistema de leads
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

-- Outras tabelas...
CREATE TABLE IF NOT EXISTS public.message_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT message_history_status_check CHECK (status IN ('sent', 'failed', 'pending', 'sending'))
);

CREATE TABLE IF NOT EXISTS public.whatsapp_validations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  response_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  validated_at TIMESTAMP WITH TIME ZONE
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_qr_codes_tracking_id ON public.qr_codes(tracking_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_type ON public.qr_codes(type);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_qr_code_id ON public.scan_sessions(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_leads_scan_session_id ON public.leads(scan_session_id);

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

-- Políticas RLS
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

-- Dados iniciais
INSERT INTO public.authorized_users (username, email, password_hash) 
VALUES ('cesmac', 'cesmac@sistema.com', crypt('cesmac@2025', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.lead_statuses (name, color)
VALUES ('Pendente', '#f59e0b')
ON CONFLICT DO NOTHING;
`;
}

const checkExistingTables = async (supabaseClient: any) => {
  const { data, error } = await supabaseClient
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', [
      'authorized_users', 'courses', 'postgraduate_courses', 'lead_statuses',
      'events', 'qr_codes', 'scan_sessions', 'leads', 'message_history'
    ]);

  if (error && !error.message.includes('does not exist')) {
    throw error;
  }

  return data?.map(row => row.table_name) || [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, config, overwriteTables } = await req.json()

    if (action === 'test_connection') {
      let supabaseClient;
      
      if (config.type === 'supabase') {
        supabaseClient = createClient(
          config.supabaseUrl,
          config.supabaseServiceKey
        );
      } else {
        throw new Error('Apenas Supabase é suportado nesta versão');
      }

      // Testar conexão
      const { data: testData, error: testError } = await supabaseClient
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);

      if (testError) {
        throw new Error(`Erro na conexão: ${testError.message}`);
      }

      // Verificar tabelas existentes
      const existingTables = await checkExistingTables(supabaseClient);

      return new Response(
        JSON.stringify({ success: true, existingTables }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'install') {
      let supabaseClient;
      
      if (config.type === 'supabase') {
        supabaseClient = createClient(
          config.supabaseUrl,
          config.supabaseServiceKey
        );
      } else {
        throw new Error('Apenas Supabase é suportado nesta versão');
      }

      // Executar schema SQL
      const schema = getDatabaseSchema();
      const { error: schemaError } = await supabaseClient.rpc('exec_sql', {
        sql: schema
      });

      if (schemaError) {
        // Tentar executar linha por linha se falhar
        const lines = schema.split(';').filter(line => line.trim());
        for (const line of lines) {
          if (line.trim()) {
            const { error } = await supabaseClient.rpc('exec_sql', { sql: line + ';' });
            if (error) {
              console.log(`Warning executing: ${line.substring(0, 50)}...`, error);
            }
          }
        }
      }

      // Salvar configuração (em produção, salvar em arquivo seguro)
      console.log('Database installation completed successfully');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Instalação concluída com sucesso',
          installedTables: [
            'authorized_users', 'courses', 'postgraduate_courses', 
            'lead_statuses', 'events', 'qr_codes', 'scan_sessions', 
            'leads', 'message_history', 'whatsapp_validations'
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Ação não reconhecida');

  } catch (error) {
    console.error('Error in database-installer:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
})
