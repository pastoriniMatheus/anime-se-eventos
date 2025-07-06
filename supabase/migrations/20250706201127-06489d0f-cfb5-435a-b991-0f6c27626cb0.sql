
-- Adicionar coluna receipt_url à tabela leads
ALTER TABLE public.leads ADD COLUMN receipt_url TEXT;

-- Criar bucket para comprovantes de pagamento
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

-- Criar políticas para o bucket de comprovantes
CREATE POLICY "Anyone can view receipts" ON storage.objects
FOR SELECT USING (bucket_id = 'receipts');

CREATE POLICY "Anyone can upload receipts" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'receipts');

-- Inserir configurações de pagamento no sistema
INSERT INTO public.system_settings (key, value, description) VALUES
('form_payment_value', 'R$ 200,00', 'Valor do pagamento do formulário'),
('form_pix_key', 'pagamento@instituicao.com.br', 'Chave PIX para pagamento'),
('form_payment_qr_code_url', '', 'URL do QR Code para pagamento PIX')
ON CONFLICT (key) DO NOTHING;
