
-- Adicionar a coluna original_url que está faltando na tabela qr_codes
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS original_url text;

-- Adicionar configurações para nomenclatura personalizável
INSERT INTO public.system_settings (key, value, description) 
VALUES 
  ('course_nomenclature', 'Produtos', 'Nome usado para se referir aos cursos no sistema')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.system_settings (key, value, description) 
VALUES 
  ('postgraduate_nomenclature', 'Pós-graduação', 'Nome usado para se referir às pós-graduações no sistema')
ON CONFLICT (key) DO NOTHING;

-- Migrar dados existentes se necessário (copiar full_url para original_url onde original_url for null)
UPDATE public.qr_codes SET original_url = full_url WHERE original_url IS NULL;
