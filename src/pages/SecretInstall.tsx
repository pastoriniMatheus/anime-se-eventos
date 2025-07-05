
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Database } from 'lucide-react';
import AccessControl from '@/components/SecretInstall/AccessControl';
import ProgressIndicator from '@/components/SecretInstall/ProgressIndicator';
import InstallationSteps from '@/components/SecretInstall/InstallationSteps';
import InstallationLog from '@/components/SecretInstall/InstallationLog';
import { DatabaseConfig, InstallationStep } from '@/types/database';
import { addLog, testSupabaseConnection, installSupabaseSchema } from '@/utils/supabaseInstaller';
import { saveSupabaseConfig, loadSupabaseConfig, updateSupabaseClient } from '@/utils/supabaseClientUpdater';

const SecretInstall = () => {
  const { toast } = useToast();
  const [installationStep, setInstallationStep] = useState<InstallationStep>('config');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<DatabaseConfig>({ type: 'supabase' });
  const [existingTables, setExistingTables] = useState<string[]>([]);
  const [installationLog, setInstallationLog] = useState<string[]>([]);

  const urlParams = new URLSearchParams(window.location.search);
  const authKey = urlParams.get('key');

  // Carregar configurações salvas ao inicializar
  useEffect(() => {
    const savedConfig = loadSupabaseConfig();
    if (savedConfig) {
      setConfig(savedConfig);
      addLogEntry('Configurações anteriores carregadas');
    }
  }, []);

  const addLogEntry = (message: string) => {
    addLog(message, setInstallationLog);
  };

  const testConnection = async () => {
    setIsLoading(true);
    setInstallationLog([]);
    addLogEntry('Iniciando teste de conexão...');

    try {
      if (config.type === 'supabase') {
        const success = await testSupabaseConnection(config, addLogEntry);
        
        if (success) {
          setExistingTables([]);
          setInstallationStep('verify');
          
          toast({
            title: "Conexão bem-sucedida",
            description: "Banco de dados acessível e Service Key validada",
          });
        } else {
          toast({
            title: "Erro de conexão",
            description: "Verifique as credenciais e tente novamente",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error('[SecretInstall] Error details:', error);
      
      toast({
        title: "Erro de conexão",
        description: error.message || 'Erro desconhecido',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startInstallation = async () => {
    setIsLoading(true);
    setInstallationStep('install');

    // SALVAR CONFIGURAÇÕES IMEDIATAMENTE
    addLogEntry('Salvando configurações do banco...');
    saveSupabaseConfig(config);
    updateSupabaseClient(config);
    addLogEntry('✓ Configurações salvas - sistema conectado ao novo banco');

    try {
      if (config.type === 'supabase') {
        const success = await installSupabaseSchema(config, addLogEntry);
        
        if (success) {
          setInstallationStep('complete');
          addLogEntry('✅ Sistema configurado e pronto para uso!');
          addLogEntry('🔄 Recarregando sistema para aplicar nova conexão...');
          
          toast({
            title: "Instalação concluída",
            description: "Sistema instalado e configurado com sucesso. Recarregando...",
          });
          
          // Recarregar após 2 segundos para aplicar nova configuração
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          
        } else {
          addLogEntry('⚠️ Instalação não concluída automaticamente');
          addLogEntry('🔧 Configurações salvas - você pode executar o SQL manualmente');
          addLogEntry('🔄 Sistema será recarregado para aplicar nova conexão...');
          
          toast({
            title: "Configuração salva",
            description: "Execute o SQL manualmente e as configurações já estão aplicadas. Recarregando...",
          });
          
          // Recarregar após 3 segundos mesmo se o SQL falhar
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro na instalação';
      addLogEntry(`ERRO: ${errorMessage}`);
      addLogEntry('🔧 Configurações foram salvas - execute o SQL manualmente');
      addLogEntry('🔄 Sistema será recarregado para aplicar nova conexão...');
      
      toast({
        title: "Configuração salva",
        description: "Execute o SQL manualmente - as configurações já estão aplicadas. Recarregando...",
      });
      
      // Recarregar após 3 segundos mesmo com erro
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AccessControl authKey={authKey}>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Database className="h-6 w-6 text-blue-600" />
              <CardTitle>Instalação do Sistema</CardTitle>
            </div>
            <CardDescription>
              Configure e instale o sistema de leads em seu banco de dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProgressIndicator currentStep={installationStep} />
            
            <InstallationSteps
              installationStep={installationStep}
              config={config}
              setConfig={setConfig}
              isLoading={isLoading}
              existingTables={existingTables}
              onTestConnection={testConnection}
              onStartInstallation={startInstallation}
            />

            <InstallationLog installationLog={installationLog} />
          </CardContent>
        </Card>
      </div>
    </AccessControl>
  );
};

export default SecretInstall;
