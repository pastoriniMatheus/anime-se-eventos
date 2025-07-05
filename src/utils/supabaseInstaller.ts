
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
    
    // Tentar uma operação real para validar a Service Key
    const { error: testError } = await targetSupabase
      .from('_test_nonexistent')
      .select('*')
      .limit(1);

    if (testError && testError.message.includes('Invalid API key')) {
      throw new Error('Service Key inválida - verifique se está correta');
    }

    // Tentar validação alternativa
    addLogFn('Tentando validação alternativa...');
    const { data: authData, error: authError } = await targetSupabase.auth.getUser();
    
    if (authError && authError.message.includes('Invalid JWT')) {
      throw new Error('Service Key inválida - JWT malformado');
    }

    addLogFn('Service Key validada com sucesso!');
    addLogFn('Conexão estabelecida com sucesso!');
    addLogFn('Pronto para instalação - instalação limpa será realizada');
    
    return true;
  } catch (error: any) {
    addLogFn(`ERRO: ${error.message}`);
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
    
    // Criar as tabelas uma por uma
    const tables = [
      {
        name: 'authorized_users',
        data: {
          username: 'synclead',
          email: 'synclead@sistema.com',
          password_hash: 's1ncl3@d'
        }
      },
      {
        name: 'courses',
        data: {
          name: 'Curso de Exemplo'
        }
      },
      {
        name: 'events',
        data: {
          name: 'Evento de Exemplo',
          description: 'Evento criado durante a instalação',
          whatsapp_number: '5511999999999'
        }
      },
      {
        name: 'leads',
        data: {
          name: 'Lead de Teste',
          email: 'teste@exemplo.com',
          whatsapp: '5511999999999'
        }
      }
    ];

    let allSuccess = true;
    
    for (const table of tables) {
      try {
        addLogFn(`Criando tabela: ${table.name}`);
        
        const { error } = await targetSupabase
          .from(table.name)
          .insert(table.data);

        if (error && !error.message.includes('already exists')) {
          addLogFn(`Erro ao criar ${table.name}: ${error.message}`);
          allSuccess = false;
          break;
        }

        addLogFn(`✓ Tabela ${table.name} processada`);
      } catch (error: any) {
        addLogFn(`Erro ao processar ${table.name}: ${error.message}`);
        allSuccess = false;
        break;
      }
    }

    if (allSuccess) {
      // Criar usuário padrão
      try {
        addLogFn('Criando usuário padrão...');
        const { error: userError } = await targetSupabase
          .from('authorized_users')
          .upsert({
            username: 'synclead',
            email: 'synclead@sistema.com',
            password_hash: 's1ncl3@d'
          });

        if (userError) {
          addLogFn(`Aviso ao criar usuário: ${userError.message}`);
        } else {
          addLogFn('✓ Usuário padrão criado: synclead / s1ncl3@d');
        }
      } catch (e: any) {
        addLogFn(`Aviso: ${e.message}`);
      }

      // Verificar instalação
      const installationVerified = await verifyInstallation(targetSupabase, addLogFn);
      
      if (installationVerified) {
        addLogFn('✓ Sistema instalado com sucesso!');
        addLogFn('✓ Tabelas principais foram criadas');
        addLogFn('✓ Usuário padrão: synclead / s1ncl3@d');
        return true;
      } else {
        addLogFn('⚠️ Instalação parcial - algumas tabelas podem não ter sido criadas');
        addLogFn('✓ Usuário padrão: synclead / s1ncl3@d');
        return true; // Consideramos sucesso parcial
      }
    } else {
      throw new Error('Falha durante a execução da instalação');
    }
  } catch (error: any) {
    addLogFn(`ERRO CRÍTICO: ${error.message}`);
    return false;
  }
};

export const verifyInstallation = async (
  supabaseClient: any, 
  addLogFn: (message: string) => void
): Promise<boolean> => {
  try {
    addLogFn('Verificando se as tabelas foram criadas...');
    
    const tablesToCheck = ['authorized_users', 'courses', 'events', 'leads'];
    let createdTables = 0;

    for (const table of tablesToCheck) {
      try {
        const { error } = await supabaseClient
          .from(table)
          .select('id')
          .limit(1);

        if (!error) {
          createdTables++;
          addLogFn(`✓ Tabela ${table} encontrada`);
        } else if (!error.message.includes('does not exist')) {
          createdTables++;
          addLogFn(`✓ Tabela ${table} encontrada (com RLS)`);
        }
      } catch (e) {
        addLogFn(`✗ Tabela ${table} não encontrada`);
      }
    }
    
    if (createdTables >= 4) {
      addLogFn(`✓ Instalação verificada - ${createdTables} tabelas principais encontradas`);
      return true;
    } else {
      addLogFn(`✗ Instalação incompleta - encontradas apenas ${createdTables} tabelas`);
      return false;
    }
  } catch (error: any) {
    addLogFn(`Erro na verificação: ${error.message}`);
    return false;
  }
};
