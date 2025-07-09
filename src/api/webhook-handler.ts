
import { supabase } from '@/integrations/supabase/client';

// Handler para processar webhooks de entrega de mensagem
export const handleMessageDeliveryWebhook = async (request: Request): Promise<Response> => {
  // Configurar CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: corsHeaders
        }
      );
    }

    const body = await request.json();
    const { delivery_code, lead_identifier, status = 'delivered' } = body;

    if (!delivery_code || !lead_identifier) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'delivery_code and lead_identifier are required' 
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
          error: 'Erro ao processar webhook: ' + error.message 
        }),
        { 
          status: 500, 
          headers: corsHeaders
        }
      );
    }

    console.log('✅ Webhook processado com sucesso:', data);

    return new Response(
      JSON.stringify(data),
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
        error: 'Erro interno do servidor: ' + (error as Error).message 
      }),
      { 
        status: 500, 
        headers: corsHeaders
      }
    );
  }
};
