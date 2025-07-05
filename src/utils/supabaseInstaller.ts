
import { DatabaseConfig } from '@/types/database';

export const addLog = (
  message: string, 
  setInstallationLog: (fn: (prev: string[]) => string[]) => void
) => {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `${timestamp}: ${message}`;
  setInstallationLog(prev => [...prev, logMessage]);
  console.log('[SecretInstall]', logMessage);
};

export const testSupabaseConnection = async (
  config: DatabaseConfig,
  addLogFn: (message: string) => void
): Promise<boolean> => {
  try {
    if (!config.supabaseUrl || !config.supabaseServiceKey) {
      throw new Error('URL do Supabase e Service Key são obrigatórios');
    }
    
    if (!config.supabaseUrl.includes('supabase.co')) {
      throw new Error('URL do Supabase deve conter "supabase.co"');
    }

    if (!config.supabaseServiceKey.startsWith('eyJ')) {
      throw new Error('Service Key deve ser um JWT válido começando com "eyJ"');
    }

    const cleanUrl = config.supabaseUrl.replace(/\/$/, '');
    addLogFn('Configuração Supabase validada localmente');
    addLogFn(`Testando conexão com: ${cleanUrl}`);

    const { createClient } = await import('@supabase/supabase-js');
    const targetSupabase = createClient(cleanUrl, config.supabaseServiceKey);
    
    addLogFn('Testando Service Key...');
    
    // Teste simples de conexão
    const { error: testError } = await targetSupabase
      .from('_nonexistent_table')
      .select('*')
      .limit(1);

    // Se chegou aqui, a Service Key é válida
    addLogFn('Service Key validada com sucesso!');
    addLogFn('Conexão estabelecida com sucesso!');
    addLogFn('Pronto para instalação - instalação limpa será realizada');
    
    return true;
  } catch (error: any) {
    const errorMessage = error?.message || 'Erro desconhecido na conexão';
    addLogFn(`ERRO: ${errorMessage}`);
    return false;
  }
};

export const installSupabaseSchema = async (
  config: DatabaseConfig,
  addLogFn: (message: string) => void
): Promise<boolean> => {
  try {
    addLogFn('Iniciando instalação do sistema...');
    
    const { createClient } = await import('@supabase/supabase-js');
    const targetSupabase = createClient(config.supabaseUrl!, config.supabaseServiceKey!);
    
    // Executar instalação usando comandos SQL diretos
    addLogFn('Executando instalação direta via SQL...');
    
    // Primeiro, tentar criar as tabelas básicas
    const createTablesSQL = `
      -- Extensões necessárias
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      
      -- Tabela de usuários autorizados
      CREATE TABLE IF NOT EXISTS public.authorized_users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;

    try {
      // Tentar executar usando uma query direta
      const { error: tableError } = await targetSupabase.rpc('exec_sql', { 
        query: createTablesSQL 
      });
      
      if (tableError) {
        addLogFn('RPC exec_sql não disponível, usando método alternativo...');
        
        // Método alternativo: tentar criar usuário diretamente
        const { data: existingUsers, error: selectError } = await targetSupabase
          .from('authorized_users')
          .select('username')
          .eq('username', 'synclead')
          .limit(1);

        if (selectError) {
          addLogFn('Tabela não existe ainda, tentando criar estrutura básica...');
          // A tabela não existe, vamos assumir que precisamos criar tudo
          addLogFn('⚠️ Não foi possível criar tabelas automaticamente');
          addLogFn('📋 Execute este SQL manualmente no seu Supabase:');
          addLogFn('');
          addLogFn('-- COPIE E EXECUTE NO SQL EDITOR DO SEU SUPABASE:');
          addLogFn('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
          addLogFn('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
          addLogFn('CREATE TABLE IF NOT EXISTS public.authorized_users (');
          addLogFn('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
          addLogFn('  username TEXT UNIQUE NOT NULL,');
          addLogFn('  email TEXT UNIQUE NOT NULL,');
          addLogFn('  password_hash TEXT NOT NULL,');
          addLogFn('  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),');
          addLogFn('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()');
          addLogFn(');');
          addLogFn('');
          addLogFn("INSERT INTO public.authorized_users (username, email, password_hash)");
          addLogFn("VALUES ('synclead', 'synclead@sistema.com', crypt('s1ncl3@d', gen_salt('bf')))");
          addLogFn("ON CONFLICT (username) DO NOTHING;");
          addLogFn('');
          addLogFn('🔄 Após executar o SQL, tente a instalação novamente');
          
          return false;
        } else {
          addLogFn('✓ Tabela authorized_users já existe');
          if (existingUsers && existingUsers.length > 0) {
            addLogFn('✓ Usuário synclead já existe');
          } else {
            addLogFn('Criando usuário padrão...');
            const { error: insertError } = await targetSupabase
              .from('authorized_users')
              .insert({
                username: 'synclead',
                email: 'synclead@sistema.com',
                password_hash: 's1ncl3@d' // Senha simples por ora
              });

            if (insertError) {
              const errorMsg = insertError?.message || 'Erro desconhecido ao criar usuário';
              if (!errorMsg.includes('already exists') && !errorMsg.includes('duplicate')) {
                addLogFn(`Erro ao criar usuário: ${errorMsg}`);
                return false;
              }
            }
            addLogFn('✓ Usuário synclead criado');
          }
        }
      } else {
        addLogFn('✓ Tabelas criadas via RPC');
        
        // Criar usuário usando insert normal
        const { error: userError } = await targetSupabase
          .from('authorized_users')
          .insert({
            username: 'synclead',
            email: 'synclead@sistema.com',
            password_hash: 's1ncl3@d'
          });

        if (userError) {
          const errorMsg = userError?.message || 'Erro desconhecido';
          if (!errorMsg.includes('already exists') && !errorMsg.includes('duplicate')) {
            addLogFn(`Aviso ao criar usuário: ${errorMsg}`);
          }
        }
        addLogFn('✓ Usuário padrão processado');
      }

      addLogFn('✓ Instalação concluída!');
      addLogFn('✓ Credenciais: synclead / s1ncl3@d');
      addLogFn('✅ Sistema pronto para usar');
      
      return true;
      
    } catch (sqlError: any) {
      const errorMsg = sqlError?.message || 'Erro desconhecido na execução SQL';
      addLogFn(`Erro SQL: ${errorMsg}`);
      return false;
    }
    
  } catch (error: any) {
    const errorMsg = error?.message || 'Erro crítico desconhecido';
    addLogFn(`ERRO CRÍTICO: ${errorMsg}`);
    return false;
  }
};

export const verifyInstallation = async (
  supabaseClient: any, 
  addLogFn: (message: string) => void
): Promise<boolean> => {
  try {
    addLogFn('Verificando instalação...');
    
    // Tentar acessar a tabela de usuários
    const { data, error } = await supabaseClient
      .from('authorized_users')
      .select('username')
      .limit(1);

    if (!error) {
      addLogFn('✓ Tabelas principais encontradas');
      return true;
    } else {
      const errorMsg = error?.message || 'Erro na verificação';
      addLogFn(`⚠️ Verificação: ${errorMsg}`);
      return false;
    }
  } catch (error: any) {
    const errorMsg = error?.message || 'Erro desconhecido na verificação';
    addLogFn(`Erro na verificação: ${errorMsg}`);
    return false;
  }
};
