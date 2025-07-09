
-- Adicionar tabela para rastreamento individual de envios
CREATE TABLE public.message_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_history_id UUID NOT NULL REFERENCES public.message_history(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_history_id, lead_id)
);

-- Adicionar código único para cada envio no histórico
ALTER TABLE public.message_history 
ADD COLUMN delivery_code TEXT UNIQUE DEFAULT CONCAT('MSG-', EXTRACT(EPOCH FROM now())::bigint, '-', SUBSTRING(gen_random_uuid()::text, 1, 8));

-- Criar índices para performance
CREATE INDEX idx_message_recipients_message_history_id ON public.message_recipients(message_history_id);
CREATE INDEX idx_message_recipients_lead_id ON public.message_recipients(lead_id);
CREATE INDEX idx_message_recipients_delivery_status ON public.message_recipients(delivery_status);
CREATE INDEX idx_message_history_delivery_code ON public.message_history(delivery_code);

-- Habilitar RLS na nova tabela
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso completo (temporário)
CREATE POLICY "Allow all access to message_recipients" 
ON public.message_recipients 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Função para confirmar entrega via webhook
CREATE OR REPLACE FUNCTION public.confirm_message_delivery(
  p_delivery_code TEXT,
  p_lead_identifier TEXT, -- pode ser email ou whatsapp
  p_status TEXT DEFAULT 'delivered'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_history_id UUID;
  v_lead_id UUID;
  v_result JSON;
BEGIN
  -- Buscar o histórico pelo código de entrega
  SELECT id INTO v_message_history_id 
  FROM public.message_history 
  WHERE delivery_code = p_delivery_code;
  
  IF v_message_history_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid delivery code');
  END IF;
  
  -- Buscar o lead pelo identificador (email ou whatsapp)
  SELECT id INTO v_lead_id 
  FROM public.leads 
  WHERE email = p_lead_identifier OR whatsapp = p_lead_identifier;
  
  IF v_lead_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Lead not found');
  END IF;
  
  -- Atualizar status de entrega
  UPDATE public.message_recipients 
  SET 
    delivery_status = p_status,
    delivered_at = CASE WHEN p_status = 'delivered' THEN now() ELSE NULL END
  WHERE message_history_id = v_message_history_id 
    AND lead_id = v_lead_id;
    
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Message recipient not found');
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Delivery status updated successfully',
    'delivery_code', p_delivery_code,
    'status', p_status
  );
END;
$$;

-- Atualizar schema do database-schema.sql para incluir as novas tabelas
-- Isso será necessário para a instalação completa
