
-- Inserir status "Pendente" padrão se não existir
INSERT INTO public.lead_statuses (name, color)
SELECT 'Pendente', '#f59e0b'
WHERE NOT EXISTS (
    SELECT 1 FROM public.lead_statuses WHERE name ILIKE 'pendente'
);

-- Atualizar leads sem status para ter o status "Pendente"
UPDATE public.leads 
SET status_id = (
    SELECT id FROM public.lead_statuses WHERE name ILIKE 'pendente' LIMIT 1
)
WHERE status_id IS NULL;
