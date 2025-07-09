
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
}

serve(async (req) => {
  console.log('🔄 Webhook endpoint chamado:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Respondendo CORS preflight');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    if (req.method !== 'POST') {
      console.log('❌ Método não permitido:', req.method);
      return new Response(
        JSON.stringify({ error: 'Method not allowed, only POST is accepted' }),
        { 
          status: 405, 
          headers: corsHeaders
        }
      );
    }

    // Ler o body da requisição
    let body;
    try {
      const requestText = await req.text();
      console.log('📥 Body recebido (raw):', requestText);
      
      if (!requestText.trim()) {
        throw new Error('Body vazio');
      }
      
      body = JSON.parse(requestText);
      console.log('📋 Body parseado:', body);
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body',
          details: (parseError as Error).message
        }),
        { 
          status: 400, 
          headers: corsHeaders
        }
      );
    }

    const { delivery_code, lead_identifier, status = 'delivered' } = body;

    if (!delivery_code || !lead_identifier) {
      console.log('❌ Campos obrigatórios faltando:', { delivery_code: !!delivery_code, lead_identifier: !!lead_identifier });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'delivery_code and lead_identifier are required',
          received: { delivery_code, lead_identifier, status }
        }),
        { 
          status: 400, 
          headers: corsHeaders
        }
      );
    }

    console.log('🔄 Processando confirmação de entrega:', {
      delivery_code,
      lead_identifier,
      status
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Chamar a função do banco para confirmar a entrega
    const { data, error } = await supabaseClient.rpc('confirm_message_delivery', {
      p_delivery_code: delivery_code,
      p_lead_identifier: lead_identifier,
      p_status: status
    })

    if (error) {
      console.error('❌ Erro na função do banco:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database error: ' + error.message 
        }),
        { 
          status: 500, 
          headers: corsHeaders
        }
      );
    }

    console.log('✅ Webhook processado com sucesso:', data);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processado com sucesso',
        data: data,
        processed_at: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: corsHeaders
      }
    );

  } catch (error) {
    console.error('💥 Erro inesperado no webhook endpoint:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor',
        details: (error as Error).message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: corsHeaders
      }
    );
  }
})
