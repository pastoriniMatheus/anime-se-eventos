
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

    console.log('📤 URL DO WEBHOOK RECEBIDA:', webhook_url);
    console.log('📋 Dados para envio:', {
      type: webhook_data.type,
      recipients_count: webhook_data.recipients?.length || 0,
      has_content: !!webhook_data.content
    });

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

    // Preparar dados em formato ainda mais simples para o n8n
    const dataToSend = {
      type: webhook_data.type,
      content: webhook_data.content,
      recipients: webhook_data.recipients?.map(recipient => ({
        name: recipient.name || 'Nome não informado',
        whatsapp: recipient.whatsapp || '',
        email: recipient.email || ''
      })) || [],
      total_recipients: webhook_data.recipients?.length || 0,
      message_id: webhook_data.message_id || null,
      timestamp: new Date().toISOString()
    };

    console.log('🚀 ENVIANDO POST PARA URL:', webhook_url);
    console.log('📦 Dados sendo enviados:', JSON.stringify(dataToSend, null, 2));

    // Enviar webhook com timeout e headers específicos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Supabase-Lead-System/1.0',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(dataToSend),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📥 STATUS DA RESPOSTA:', response.status);
      console.log('📥 HEADERS DA RESPOSTA:', Object.fromEntries(response.headers.entries()));

      let responseText = '';
      try {
        responseText = await response.text();
        console.log('📥 CORPO DA RESPOSTA:', responseText);
      } catch (textError) {
        console.error('❌ Erro ao ler resposta:', textError);
        responseText = 'Erro ao ler resposta do webhook';
      }
      
      if (!response.ok) {
        console.error('❌ WEBHOOK RETORNOU ERRO:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText,
          url: webhook_url
        });
        
        let errorMessage = `Webhook retornou status ${response.status}`;
        let errorDetails = responseText;
        
        if (response.status === 404) {
          errorMessage = 'Webhook não encontrado (404)';
          errorDetails = 'Verifique se a URL está correta: ' + webhook_url;
        } else if (response.status === 405) {
          errorMessage = 'Método não permitido (405)';
          errorDetails = 'O webhook não aceita POST. URL: ' + webhook_url;
        } else if (response.status === 400) {
          errorMessage = 'Dados inválidos (400)';
          errorDetails = 'O webhook rejeitou os dados enviados: ' + responseText;
        } else if (response.status === 500) {
          errorMessage = 'Erro interno do servidor (500)';
          errorDetails = 'Problema no n8n: ' + responseText;
        }
        
        return new Response(JSON.stringify({
          error: errorMessage,
          details: errorDetails,
          webhook_response: responseText,
          status_code: response.status,
          webhook_url: webhook_url,
          sent_data: dataToSend
        }), { 
          status: 422, // Retornando 422 ao invés do status original para não quebrar o frontend
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('✅ WEBHOOK EXECUTADO COM SUCESSO');
      
      return new Response(JSON.stringify({
        success: true,
        status: response.status,
        statusText: response.statusText,
        response: responseText,
        webhook_url: webhook_url,
        message: 'Webhook sent successfully',
        recipients_count: webhook_data.recipients?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      console.error('❌ ERRO AO CHAMAR WEBHOOK:', {
        error: fetchError,
        message: fetchError.message,
        name: fetchError.name,
        url: webhook_url
      });
      
      let errorMessage = 'Erro ao conectar com o webhook';
      let errorDetails: any = {};
      
      if (fetchError.name === 'AbortError') {
        errorMessage = 'Timeout: Webhook demorou mais de 30 segundos';
        errorDetails = { timeout: true, duration: '30s' };
      } else if (fetchError.message?.includes('fetch')) {
        errorMessage = 'Não foi possível conectar ao webhook';
        errorDetails = { connection_error: true, url: webhook_url };
      } else {
        errorDetails = { 
          error_type: fetchError.name || 'UnknownError',
          original_message: fetchError.message
        };
      }
      
      return new Response(JSON.stringify({
        error: errorMessage,
        details: errorDetails,
        webhook_url: webhook_url
      }), { 
        status: 422, // Retornando 422 para não quebrar o frontend
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('💥 ERRO GERAL NA EDGE FUNCTION:', {
      error: error,
      message: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({
      error: 'Webhook execution failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
