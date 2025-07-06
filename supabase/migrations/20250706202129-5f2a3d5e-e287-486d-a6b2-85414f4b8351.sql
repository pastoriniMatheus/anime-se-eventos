
-- Corrigir a função get_scan_sessions para resolver ambiguidade de tracking_id
DROP FUNCTION IF EXISTS public.get_scan_sessions();

CREATE OR REPLACE FUNCTION public.get_scan_sessions()
RETURNS TABLE(
  id uuid,
  qr_code_id uuid,
  event_id uuid,
  lead_id uuid,
  scanned_at timestamp with time zone,
  user_agent text,
  ip_address text,
  qr_code json,
  event json,
  lead json
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ss.id,
    ss.qr_code_id,
    ss.event_id,
    ss.lead_id,
    ss.scanned_at,
    ss.user_agent,
    ss.ip_address,
    CASE 
      WHEN qr.id IS NOT NULL THEN 
        json_build_object(
          'id', qr.id,
          'short_url', qr.short_url,
          'type', qr.type,
          'scans', qr.scans,
          'tracking_id', qr.tracking_id
        )
      ELSE NULL
    END as qr_code,
    CASE 
      WHEN e.id IS NOT NULL THEN 
        json_build_object(
          'id', e.id,
          'name', e.name,
          'whatsapp_number', e.whatsapp_number
        )
      ELSE NULL
    END as event,
    CASE 
      WHEN l.id IS NOT NULL THEN 
        json_build_object(
          'id', l.id,
          'name', l.name,
          'email', l.email,
          'whatsapp', l.whatsapp
        )
      ELSE NULL
    END as lead
  FROM scan_sessions ss
  LEFT JOIN qr_codes qr ON ss.qr_code_id = qr.id
  LEFT JOIN events e ON ss.event_id = e.id
  LEFT JOIN leads l ON ss.lead_id = l.id
  ORDER BY ss.scanned_at DESC;
END;
$function$
