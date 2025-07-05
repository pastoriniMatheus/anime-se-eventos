
-- Criar tabela system_settings para armazenar configurações do sistema
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso completo (já que não é específico por usuário)
CREATE POLICY "Allow all access to system_settings" 
  ON public.system_settings 
  FOR ALL 
  USING (true);

-- Inserir algumas configurações padrão
INSERT INTO public.system_settings (key, value, description) VALUES
('visual_logo_url', '/lovable-uploads/c7eb5d40-5d53-4b46-b5a9-d35d5a784ac7.png', 'URL do logotipo do sistema'),
('visual_title', 'Sistema de Captura de Leads', 'Título principal do sistema'),
('visual_subtitle', 'Gestão Inteligente de Leads', 'Subtítulo do sistema'),
('form_title', 'Cadastre-se agora', 'Título do formulário de captura'),
('form_thank_you_title', 'Obrigado!', 'Título da página de agradecimento'),
('form_thank_you_message', 'Sua inscrição foi realizada com sucesso!', 'Mensagem de agradecimento'),
('webhook_urls', '{"whatsapp":"https://n8n.intrategica.com.br/webhook-test/disparos","email":"https://n8n.intrategica.com.br/webhook-test/disparos","sms":"https://n8n.intrategica.com.br/webhook-test/disparos","whatsappValidation":"https://n8n-wh.intrategica.com.br/webhook/qrcode-cesmac","sync":""}', 'URLs dos webhooks configurados');
