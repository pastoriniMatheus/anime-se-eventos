
import { supabase } from '@/integrations/supabase/client';

// Handler para processar webhooks de entrega de mensagem
export const handleMessageDeliveryWebhook = async (request: Request): Promise<Response> => {
  // Configurar CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  };

  console.log('🔄 Webhook handler chamado:', {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  });

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    console.log('✅ Respondendo CORS preflight');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    if (request.method !== 'POST') {
      console.log('❌ Método não permitido:', request.method);
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
      const requestText = await request.text();
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

    console.log('🔄 Processando confirmação de entrega via API handler:', {
      delivery_code,
      lead_identifier,
      status
    });

    // Chamar a edge function do Supabase para processar a confirmação
    const { data, error } = await supabase.functions.invoke('message-delivery-proxy', {
      body: {
        delivery_code,
        lead_identifier,
        status
      }
    });

    if (error) {
      console.error('❌ Erro na Edge Function:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao processar webhook na edge function',
          details: error.message,
          edge_function_error: error
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
    console.error('💥 Erro inesperado no webhook handler:', error);
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
};
