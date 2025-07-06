
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Requisição recebida:', req.url);
    
    // Criar cliente Supabase usando as variáveis de ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Key presente:', !!supabaseServiceKey);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Variáveis de ambiente não encontradas');
      return new Response('Configuração do servidor inválida', { 
        status: 500,
        headers: corsHeaders 
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extrair short_url da URL
    const url = new URL(req.url);
    const shortUrl = url.pathname.split('/').pop();
    
    console.log('Short URL extraída:', shortUrl);

    if (!shortUrl) {
      return new Response('Short URL não fornecida', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // Buscar QR code pelo short_url
    console.log('Buscando QR code:', shortUrl);
    const { data: qrCode, error } = await supabase
      .from('qr_codes')
      .select('*, event:events(name, whatsapp_number)')
      .eq('short_url', shortUrl)
      .single();

    if (error) {
      console.error('Erro ao buscar QR code:', error);
      return new Response('QR code não encontrado', { 
        status: 404,
        headers: corsHeaders 
      });
    }

    if (!qrCode) {
      console.log('QR code não encontrado para short_url:', shortUrl);
      return new Response('QR code não encontrado', { 
        status: 404,
        headers: corsHeaders 
      });
    }

    console.log('QR code encontrado:', qrCode);

    // Registrar scan session
    const userAgent = req.headers.get('user-agent') || '';
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     req.headers.get('cf-connecting-ip') || '';

    console.log('Registrando scan session para QR code:', qrCode.id);
    const { data: scanSession, error: sessionError } = await supabase
      .from('scan_sessions')
      .insert({
        qr_code_id: qrCode.id,
        event_id: qrCode.event_id,
        user_agent: userAgent,
        ip_address: ipAddress,
        scanned_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Erro ao registrar scan session:', sessionError);
    } else {
      console.log('Scan session registrada com sucesso:', scanSession);
    }

    // Incrementar contador de scans no QR code
    const { error: updateError } = await supabase
      .from('qr_codes')
      .update({ 
        scans: (qrCode.scans || 0) + 1 
      })
      .eq('id', qrCode.id);

    if (updateError) {
      console.error('Erro ao atualizar contador de scans:', updateError);
    } else {
      console.log('Contador de scans atualizado');
    }

    // Determinar URL de redirecionamento
    let redirectUrl = qrCode.original_url;
    
    if (!redirectUrl) {
      console.error('URL de redirecionamento não encontrada no QR code');
      return new Response('URL de redirecionamento não configurada', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    console.log('Redirecionando para:', redirectUrl);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl
      }
    });

  } catch (error) {
    console.error('Erro na função qr-redirect:', error);
    return new Response('Erro interno do servidor', { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
