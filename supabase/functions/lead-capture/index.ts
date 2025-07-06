
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
    console.log('Lead capture request received');
    
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

    const { 
      name, 
      email, 
      whatsapp, 
      eventName, 
      trackingId, 
      courseId, 
      postgraduateCourseId, 
      courseType,
      receiptUrl 
    } = await req.json();

    console.log('Form data received:', { 
      name, 
      email, 
      whatsapp, 
      eventName, 
      trackingId, 
      courseType,
      receiptUrl
    });

    // Validações
    if (!name) {
      return new Response(JSON.stringify({ error: 'Nome é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!whatsapp) {
      return new Response(JSON.stringify({ error: 'WhatsApp é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar evento pelo nome
    let eventId = null;
    if (eventName) {
      console.log('Buscando evento:', eventName);
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('name', eventName)
        .single();

      if (eventError) {
        console.error('Erro ao buscar evento:', eventError);
      } else if (event) {
        eventId = event.id;
        console.log('Evento encontrado:', eventId);
      }
    }

    // Buscar scan session pelo tracking_id se fornecido
    let scanSessionId = null;
    if (trackingId) {
      console.log('Buscando scan session pelo tracking:', trackingId);
      
      // Primeiro buscar o QR code pelo tracking_id
      const { data: qrCode, error: qrError } = await supabase
        .from('qr_codes')
        .select('id')
        .eq('tracking_id', trackingId)
        .single();

      if (!qrError && qrCode) {
        console.log('QR code encontrado:', qrCode.id);
        
        // Buscar scan session pelo qr_code_id
        const { data: scanSession, error: sessionError } = await supabase
          .from('scan_sessions')
          .select('id')
          .eq('qr_code_id', qrCode.id)
          .is('lead_id', null)
          .order('scanned_at', { ascending: false })
          .limit(1)
          .single();

        if (!sessionError && scanSession) {
          scanSessionId = scanSession.id;
          console.log('Scan session encontrada:', scanSessionId);
        }
      }
    }

    // Criar lead
    const leadData: any = {
      name,
      whatsapp,
      event_id: eventId,
      scan_session_id: scanSessionId
    };

    // Adicionar campos opcionais
    if (email) leadData.email = email;
    if (courseId) leadData.course_id = courseId;
    if (postgraduateCourseId) leadData.postgraduate_course_id = postgraduateCourseId;
    if (courseType) leadData.course_type = courseType;
    if (receiptUrl) leadData.receipt_url = receiptUrl;

    console.log('Criando lead com dados:', leadData);

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single();

    if (leadError) {
      console.error('Erro ao criar lead:', leadError);
      return new Response(JSON.stringify({ error: 'Erro ao salvar lead' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Lead criado com sucesso:', lead.id);

    // Atualizar scan session se existir
    if (scanSessionId) {
      console.log('Atualizando scan session:', scanSessionId);
      const { error: updateError } = await supabase
        .from('scan_sessions')
        .update({ 
          lead_id: lead.id,
          converted: true,
          converted_at: new Date().toISOString()
        })
        .eq('id', scanSessionId);

      if (updateError) {
        console.error('Erro ao atualizar scan session:', updateError);
      } else {
        console.log('Scan session atualizada com sucesso');
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      leadId: lead.id,
      message: 'Lead criado com sucesso!' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro na função lead-capture:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
