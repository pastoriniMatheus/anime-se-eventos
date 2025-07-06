
-- Adicionar o usuário anapaula com a senha @n@prosperidade
INSERT INTO public.authorized_users (username, email, password_hash) 
VALUES ('anapaula', 'anapaula@animesi.com.br', crypt('@n@prosperidade', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;
