
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
    console.log('QR redirect request:', req.url);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response('Server configuration error', { 
        status: 500,
        headers: corsHeaders 
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract short_url from URL
    const url = new URL(req.url);
    const shortUrl = url.pathname.split('/').pop();
    
    console.log('Short URL:', shortUrl);

    if (!shortUrl) {
      return new Response('Short URL not provided', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // Find QR code by short_url
    const { data: qrCode, error } = await supabase
      .from('qr_codes')
      .select('*, event:events(name, whatsapp_number)')
      .eq('short_url', shortUrl)
      .single();

    if (error || !qrCode) {
      console.error('QR code not found:', error);
      return new Response('QR code not found', { 
        status: 404,
        headers: corsHeaders 
      });
    }

    console.log('QR code found:', qrCode.id);

    // Increment scan counter usando RPC function (mais confiável)
    const { error: incrementError } = await supabase.rpc('increment_qr_scan', {
      tracking_id: qrCode.tracking_id
    });

    if (incrementError) {
      console.error('Error incrementing scan count:', incrementError);
    } else {
      console.log('Scan count incremented successfully');
    }

    // Register scan session
    const userAgent = req.headers.get('user-agent') || '';
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';

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
      console.error('Error registering scan session:', sessionError);
    } else {
      console.log('Scan session registered:', scanSession.id);
    }

    // Determine redirect URL
    let redirectUrl = qrCode.original_url;
    
    if (!redirectUrl) {
      console.error('No redirect URL found');
      return new Response('Redirect URL not configured', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    // Adicionar tracking_id na URL se não estiver presente
    const urlObj = new URL(redirectUrl);
    if (!urlObj.searchParams.has('t') && !urlObj.searchParams.has('tracking')) {
      urlObj.searchParams.set('t', qrCode.tracking_id);
      redirectUrl = urlObj.toString();
    }

    console.log('Redirecting to:', redirectUrl);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl
      }
    });

  } catch (error) {
    console.error('Error in qr-redirect function:', error);
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
