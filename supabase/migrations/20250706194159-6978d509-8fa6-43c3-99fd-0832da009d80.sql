
-- Create function to increment QR code scan count
CREATE OR REPLACE FUNCTION public.increment_qr_scan(tracking_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.qr_codes 
  SET scans = scans + 1 
  WHERE tracking_id = increment_qr_scan.tracking_id;
END;
$function$
