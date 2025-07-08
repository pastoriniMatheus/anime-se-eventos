
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.error('❌ Método não permitido:', req.method);
    return new Response(JSON.stringify({
      error: 'Method not allowed',
      details: 'Only POST method is allowed'
    }), { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const requestBody = await req.text();
    console.log('📥 Body recebido (raw):', requestBody);
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBody);
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON:', parseError);
      return new Response(JSON.stringify({
        error: 'Invalid JSON',
        details: 'Request body must be valid JSON'
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { webhook_url, webhook_data } = parsedBody;

    if (!webhook_url || !webhook_data) {
      console.error('❌ Campos obrigatórios faltando:', { webhook_url: !!webhook_url, webhook_data: !!webhook_data });
      return new Response(JSON.stringify({
        error: 'Missing required fields',
        details: 'webhook_url and webhook_data are required'
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('📤 ENVIANDO WEBHOOK PARA URL EXATA:', webhook_url);
    console.log('📋 Tipo de mensagem:', webhook_data.type);
    console.log('📋 Número de destinatários:', webhook_data.recipients?.length || 0);

    // Validar se a URL é válida
    let validUrl;
    try {
      validUrl = new URL(webhook_url);
      console.log('✅ URL válida confirmada:', validUrl.toString());
    } catch (urlError) {
      console.error('❌ URL inválida:', webhook_url, urlError);
      return new Response(JSON.stringify({
        error: 'Invalid webhook URL',
        details: 'The provided webhook URL is not valid',
        webhook_url: webhook_url
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Enviar webhook com timeout e headers adequados - GARANTINDO QUE É POST
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      console.log('🚀 FAZENDO REQUISIÇÃO POST PARA URL:', webhook_url);
      console.log('📦 Dados sendo enviados via POST:', JSON.stringify(webhook_data, null, 2));

      const response = await fetch(webhook_url, {
        method: 'POST', // EXPLICITAMENTE DEFINIDO COMO POST
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Supabase-Edge-Function/1.0',
          'X-Source': 'lead-messaging-system',
          'X-HTTP-Method': 'POST' // Header adicional para garantir
        },
        body: JSON.stringify(webhook_data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let responseText;
      try {
        responseText = await response.text();
      } catch (textError) {
        console.error('❌ Erro ao ler resposta:', textError);
        responseText = 'Erro ao ler resposta do webhook';
      }
      
      console.log('📥 RESPOSTA COMPLETA DO WEBHOOK (POST):', {
        url: webhook_url,
        method: 'POST',
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      });

      if (!response.ok) {
        console.error('❌ WEBHOOK RETORNOU ERRO PARA POST:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText,
          url: webhook_url,
          method: 'POST'
        });
        
        // Mensagens de erro mais específicas
        let errorMessage = `Webhook POST retornou ${response.status} (${response.statusText})`;
        let errorDetails = responseText;
        
        if (response.status === 404) {
          errorMessage = 'Webhook não encontrado (404) - POST';
          errorDetails = 'Verifique se a URL está correta e se o endpoint aceita POST no n8n';
        } else if (response.status === 405) {
          errorMessage = 'Método POST não permitido (405)';
          errorDetails = 'O webhook não aceita requisições POST. Verifique a configuração do n8n';
        } else if (response.status === 401) {
          errorMessage = 'Erro de autorização (401) - POST';
          errorDetails = 'Verifique as credenciais de acesso ao webhook';
        } else if (response.status === 500) {
          errorMessage = 'Erro interno do servidor (500) - POST';
          errorDetails = 'Problema no n8n ou no workflow';
        }
        
        return new Response(JSON.stringify({
          error: errorMessage,
          details: errorDetails,
          webhook_response: responseText,
          status_code: response.status,
          webhook_url: webhook_url,
          method_used: 'POST'
        }), { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('✅ WEBHOOK POST EXECUTADO COM SUCESSO');
      
      return new Response(JSON.stringify({
        success: true,
        status: response.status,
        statusText: response.statusText,
        response: responseText,
        webhook_url: webhook_url,
        method_used: 'POST',
        message: 'Webhook POST sent successfully',
        recipients_count: webhook_data.recipients?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      let errorMessage = 'Erro desconhecido no webhook POST';
      let errorDetails = {};
      
      if (fetchError.name === 'AbortError') {
        errorMessage = 'Timeout: O webhook POST demorou mais de 30 segundos para responder';
        errorDetails = { timeout: true, duration: '30s', method: 'POST' };
      } else if (fetchError.message?.includes('fetch')) {
        errorMessage = 'Não foi possível conectar ao webhook via POST. Verifique se a URL está correta e acessível';
        errorDetails = { connection_error: true, url: webhook_url, method: 'POST' };
      } else {
        errorMessage = fetchError.message || 'Erro na comunicação POST com o webhook';
        errorDetails = { 
          error_type: fetchError.name || 'UnknownError',
          original_message: fetchError.message,
          method: 'POST'
        };
      }
      
      console.error('❌ ERRO DETALHADO NO WEBHOOK POST:', {
        error: fetchError,
        message: errorMessage,
        details: errorDetails,
        webhook_url: webhook_url,
        method: 'POST'
      });
      
      return new Response(JSON.stringify({
        error: errorMessage,
        details: errorDetails,
        webhook_url: webhook_url,
        method_attempted: 'POST'
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('💥 ERRO GERAL NA EDGE FUNCTION (POST):', {
      error: error,
      message: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({
      error: 'Webhook POST execution failed',
      details: error.message,
      timestamp: new Date().toISOString(),
      method_attempted: 'POST'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
