
-- Add the missing scans column to qr_codes table
ALTER TABLE public.qr_codes 
ADD COLUMN scans INTEGER NOT NULL DEFAULT 0;

-- Update existing QR codes to have a default scan count of 0
UPDATE public.qr_codes 
SET scans = 0 
WHERE scans IS NULL;
