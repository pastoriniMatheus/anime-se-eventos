
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

const checkExistingTables = async (supabaseClient: any) => {
  try {
    const { data, error } = await supabaseClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'authorized_users', 'courses', 'postgraduate_courses', 'lead_statuses',
        'events', 'qr_codes', 'scan_sessions', 'leads', 'message_history'
      ]);

    if (error) {
      console.log('Error checking tables:', error);
      return [];
    }

    return data?.map((row: any) => row.table_name) || [];
  } catch (error) {
    console.log('Exception checking tables:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, config } = body;

    console.log('Received request:', { action, configType: config?.type });

    if (action === 'test_connection') {
      if (!config || !config.type) {
        throw new Error('Configuração inválida');
      }

      if (config.type === 'supabase') {
        if (!config.supabaseUrl || !config.supabaseServiceKey) {
          throw new Error('URL do Supabase e Service Key são obrigatórios');
        }

        // Validar formato da URL
        if (!config.supabaseUrl.includes('supabase.co')) {
          throw new Error('URL do Supabase inválida');
        }

        const supabaseClient = createClient(
          config.supabaseUrl,
          config.supabaseServiceKey
        );

        // Testar conexão simples
        const { data: testData, error: testError } = await supabaseClient
          .from('information_schema.tables')
          .select('table_name')
          .limit(1);

        if (testError) {
          console.log('Supabase connection error:', testError);
          throw new Error(`Erro na conexão Supabase: ${testError.message}`);
        }

        // Verificar tabelas existentes
        const existingTables = await checkExistingTables(supabaseClient);

        return new Response(
          JSON.stringify({ 
            success: true, 
            existingTables,
            message: 'Conexão Supabase estabelecida com sucesso'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        throw new Error('Apenas Supabase é suportado nesta versão');
      }
    }

    if (action === 'install') {
      // Implementação da instalação será adicionada posteriormente
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Funcionalidade de instalação em desenvolvimento'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Ação não reconhecida');

  } catch (error: any) {
    console.error('Error in database-installer:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erro interno do servidor',
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Mudando para 200 para evitar problemas de CORS
      }
    );
  }
})
