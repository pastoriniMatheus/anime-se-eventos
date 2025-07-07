
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
      return new Response(JSON.stringify({ 
        error: 'Server configuration error',
        success: false
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
      receiptUrl,
      scanSessionId
    } = await req.json();

    console.log('Form data received:', { 
      name, 
      email, 
      whatsapp, 
      eventName, 
      trackingId, 
      courseType,
      receiptUrl,
      scanSessionId,
      courseId: courseId || 'null',
      postgraduateCourseId: postgraduateCourseId || 'null'
    });

    // Validações básicas
    if (!name || name.trim() === '') {
      return new Response(JSON.stringify({ 
        error: 'Nome é obrigatório',
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!whatsapp || whatsapp.trim() === '') {
      return new Response(JSON.stringify({ 
        error: 'WhatsApp é obrigatório',
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar evento pelo nome se fornecido
    let eventId = null;
    if (eventName && eventName.trim() !== '') {
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

    // Preparar dados do lead
    const leadData: any = {
      name: name.trim(),
      whatsapp: whatsapp.trim(),
      event_id: eventId,
      scan_session_id: scanSessionId
    };

    // Adicionar campos opcionais
    if (email && email.trim() !== '') {
      leadData.email = email.trim();
    }

    if (courseId && courseId.trim() !== '') {
      leadData.course_id = courseId;
    }

    if (postgraduateCourseId && postgraduateCourseId.trim() !== '') {
      leadData.postgraduate_course_id = postgraduateCourseId;
    }

    if (courseType && courseType.trim() !== '') {
      leadData.course_type = courseType;
    }

    if (receiptUrl && receiptUrl.trim() !== '') {
      leadData.receipt_url = receiptUrl;
    }

    console.log('Criando lead com dados:', leadData);

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single();

    if (leadError) {
      console.error('Erro ao criar lead:', leadError);
      return new Response(JSON.stringify({ 
        error: 'Erro ao salvar lead: ' + leadError.message,
        success: false
      }), {
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
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor: ' + (error instanceof Error ? error.message : 'Erro desconhecido'),
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
