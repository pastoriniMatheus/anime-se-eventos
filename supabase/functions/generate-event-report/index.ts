
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Iniciando geração de relatório:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.json();
    console.log('Body da requisição:', requestBody);

    const { event_id } = requestBody;

    if (!event_id) {
      console.error('Event ID não fornecido');
      return new Response(JSON.stringify({ error: 'Event ID é obrigatório' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Buscando evento:', event_id);

    // Buscar dados do evento
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (eventError) {
      console.error('Erro ao buscar evento:', eventError);
      return new Response(JSON.stringify({ error: 'Evento não encontrado' }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Evento encontrado:', event.name);

    // Buscar QR codes do evento
    const { data: qrCodes } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('event_id', event_id);

    console.log('QR codes encontrados:', qrCodes?.length || 0);

    // Buscar leads do evento
    const { data: leads } = await supabase
      .from('leads')
      .select(`
        *,
        course:courses(name),
        postgraduate_course:postgraduate_courses(name),
        status:lead_statuses(name, color)
      `)
      .eq('event_id', event_id)
      .order('created_at', { ascending: false });

    console.log('Leads encontrados:', leads?.length || 0);

    // Buscar sessões de scan
    const { data: scanSessions } = await supabase
      .from('scan_sessions')
      .select('*')
      .eq('event_id', event_id);

    console.log('Sessões de scan encontradas:', scanSessions?.length || 0);

    // Determinar tipo do evento
    const qrTypes = qrCodes?.map(qr => qr.type || 'whatsapp') || [];
    const hasWhatsApp = qrTypes.includes('whatsapp');
    const hasForm = qrTypes.includes('form');
    
    let eventType = 'Não definido';
    if (hasWhatsApp && hasForm) {
      eventType = 'Híbrido (WhatsApp + Formulário)';
    } else if (hasWhatsApp) {
      eventType = 'WhatsApp';
    } else if (hasForm) {
      eventType = 'Formulário';
    } else if (event.whatsapp_number) {
      eventType = 'WhatsApp (legado)';
    }

    // Calcular métricas
    const totalLeads = leads?.length || 0;
    const totalScans = scanSessions?.length || 0;
    const convertedScans = scanSessions?.filter(s => s?.lead_id)?.length || 0;
    const conversionRate = totalScans > 0 ? (convertedScans / totalScans) * 100 : 0;
    const totalQRScans = qrCodes?.reduce((sum, qr) => sum + (qr.scans || 0), 0) || 0;

    // Agrupar leads por status
    const leadsByStatus = leads?.reduce((acc: any, lead: any) => {
      const statusName = lead.status?.name || 'Sem status';
      acc[statusName] = (acc[statusName] || 0) + 1;
      return acc;
    }, {}) || {};

    // Agrupar leads por curso
    const leadsByCourse = leads?.reduce((acc: any, lead: any) => {
      let courseName = 'Não informado';
      if (lead.course?.name) {
        courseName = lead.course.name;
      } else if (lead.postgraduate_course?.name) {
        courseName = lead.postgraduate_course.name;
      }
      acc[courseName] = (acc[courseName] || 0) + 1;
      return acc;
    }, {}) || {};

    console.log('Gerando HTML do relatório...');

    // Gerar HTML do relatório
    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório - ${event.name}</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 20px; 
                color: #333;
                line-height: 1.6;
                background-color: #f8f9fa;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 3px solid #2563eb;
                padding-bottom: 20px;
            }
            .header h1 {
                color: #1e40af;
                margin-bottom: 10px;
                font-size: 2.5em;
            }
            .header h2 {
                color: #3b82f6;
                margin-bottom: 5px;
            }
            .metrics { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                gap: 20px; 
                margin-bottom: 40px; 
            }
            .metric-card { 
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
                padding: 20px; 
                border-radius: 10px; 
                border-left: 5px solid #2563eb;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .metric-value { 
                font-size: 2em; 
                font-weight: bold; 
                color: #2563eb; 
                margin-bottom: 5px;
            }
            .metric-label { 
                font-size: 0.9em; 
                color: #64748b; 
                font-weight: 500;
            }
            .section { 
                margin-bottom: 40px; 
                background: white;
                border-radius: 8px;
                overflow: hidden;
            }
            .section h3 { 
                color: #1e40af; 
                border-bottom: 2px solid #e2e8f0;
                padding: 15px 20px;
                margin: 0;
                background: #f1f5f9;
                font-size: 1.3em;
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                background: white;
            }
            th, td { 
                padding: 15px 20px; 
                text-align: left; 
                border-bottom: 1px solid #e2e8f0; 
            }
            th { 
                background-color: #f8fafc; 
                font-weight: 600;
                color: #475569;
                font-size: 0.95em;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            tr:hover { 
                background-color: #f8fafc; 
            }
            .status-badge {
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.8em;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .event-info, .qr-info {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                padding: 25px;
                border-radius: 10px;
                margin-bottom: 30px;
                border: 1px solid #0ea5e9;
                box-shadow: 0 2px 4px rgba(14, 165, 233, 0.1);
            }
            .qr-info {
                background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
                border-color: #eab308;
                box-shadow: 0 2px 4px rgba(234, 179, 8, 0.1);
            }
            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }
            .info-item {
                background: rgba(255,255,255,0.7);
                padding: 15px;
                border-radius: 8px;
                border: 1px solid rgba(0,0,0,0.1);
            }
            .info-item strong {
                color: #1e40af;
            }
            @media print {
                body { 
                    margin: 0; 
                    background: white;
                }
                .container {
                    box-shadow: none;
                    max-width: none;
                }
                .metric-card, .section { 
                    break-inside: avoid; 
                }
                table { 
                    break-inside: avoid; 
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 Relatório do Evento</h1>
                <h2>${event.name}</h2>
                <p style="color: #64748b; margin-top: 10px;">
                    Gerado em: ${new Date().toLocaleDateString('pt-BR', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </p>
            </div>

            <div class="event-info">
                <h3 style="margin: 0 0 15px 0; color: #0369a1;">📋 Informações do Evento</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Tipo de Evento:</strong> ${eventType}
                    </div>
                    <div class="info-item">
                        <strong>Data de Criação:</strong> ${new Date(event.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    <div class="info-item">
                        <strong>Total de QR Codes:</strong> ${qrCodes?.length || 0}
                    </div>
                    ${event.whatsapp_number ? `
                    <div class="info-item">
                        <strong>WhatsApp:</strong> ${event.whatsapp_number}
                    </div>
                    ` : ''}
                </div>
            </div>

            ${qrCodes && qrCodes.length > 0 ? `
            <div class="qr-info">
                <h3 style="margin: 0 0 15px 0; color: #92400e;">📱 QR Codes do Evento</h3>
                <div class="info-grid">
                    ${qrCodes.map(qr => `
                        <div class="info-item">
                            <strong>Tipo:</strong> ${qr.type === 'form' ? 'Formulário' : 'WhatsApp'}<br>
                            <strong>ID:</strong> ${qr.tracking_id || 'N/A'}<br>
                            <strong>Scans:</strong> ${qr.scans || 0}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <div class="metrics">
                <div class="metric-card">
                    <div class="metric-value">${totalLeads}</div>
                    <div class="metric-label">Total de Leads</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${totalQRScans}</div>
                    <div class="metric-label">Total de Scans QR</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${totalScans}</div>
                    <div class="metric-label">Sessões de Scan</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${convertedScans}</div>
                    <div class="metric-label">Conversões</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${conversionRate.toFixed(1)}%</div>
                    <div class="metric-label">Taxa de Conversão</div>
                </div>
            </div>

            ${Object.keys(leadsByStatus).length > 0 ? `
            <div class="section">
                <h3>📊 Leads por Status</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Quantidade</th>
                            <th>Percentual</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(leadsByStatus).map(([status, count]: [string, any]) => `
                            <tr>
                                <td>${status}</td>
                                <td><strong>${count}</strong></td>
                                <td>${totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(1) : '0'}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            ${Object.keys(leadsByCourse).length > 0 ? `
            <div class="section">
                <h3>🎓 Leads por Curso</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Curso</th>
                            <th>Quantidade</th>
                            <th>Percentual</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(leadsByCourse).map(([course, count]: [string, any]) => `
                            <tr>
                                <td>${course}</td>
                                <td><strong>${count}</strong></td>
                                <td>${totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(1) : '0'}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            ${leads && leads.length > 0 ? `
            <div class="section">
                <h3>👥 Lista de Leads</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>WhatsApp</th>
                            <th>Curso</th>
                            <th>Status</th>
                            <th>Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${leads.map((lead: any) => `
                            <tr>
                                <td><strong>${lead.name || 'N/A'}</strong></td>
                                <td>${lead.email || 'N/A'}</td>
                                <td>${lead.whatsapp || 'N/A'}</td>
                                <td>${lead.course?.name || lead.postgraduate_course?.name || 'N/A'}</td>
                                <td>
                                    <span class="status-badge" style="background-color: ${lead.status?.color || '#6b7280'}20; color: ${lead.status?.color || '#6b7280'};">
                                        ${lead.status?.name || 'Sem status'}
                                    </span>
                                </td>
                                <td>${new Date(lead.created_at).toLocaleDateString('pt-BR')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : `
            <div class="section">
                <h3>👥 Lista de Leads</h3>
                <p style="text-align: center; padding: 40px; color: #64748b;">
                    Nenhum lead encontrado para este evento.
                </p>
            </div>
            `}
        </div>
    </body>
    </html>
    `;

    console.log('Relatório HTML gerado com sucesso');

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
