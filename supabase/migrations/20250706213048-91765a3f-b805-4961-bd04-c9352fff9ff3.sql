
-- Criar o usuário anapaula com a senha @n@prosperidade
INSERT INTO public.authorized_users (username, email, password_hash) 
VALUES ('anapaula', 'anapaula@animesi.com.br', crypt('@n@prosperidade', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;

-- Verificar se foi criado corretamente
SELECT username, email, created_at FROM public.authorized_users WHERE username = 'anapaula';
