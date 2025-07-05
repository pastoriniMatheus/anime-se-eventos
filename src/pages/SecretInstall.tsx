
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Database } from 'lucide-react';
import AccessControl from '@/components/SecretInstall/AccessControl';
import ProgressIndicator from '@/components/SecretInstall/ProgressIndicator';
import InstallationSteps from '@/components/SecretInstall/InstallationSteps';
import InstallationLog from '@/components/SecretInstall/InstallationLog';
import { DatabaseConfig, InstallationStep } from '@/types/database';
import { addLog, testSupabaseConnection, installSupabaseSchema } from '@/utils/supabaseInstaller';

const SecretInstall = () => {
  const { toast } = useToast();
  const [installationStep, setInstallationStep] = useState<InstallationStep>('config');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<DatabaseConfig>({ type: 'supabase' });
  const [existingTables, setExistingTables] = useState<string[]>([]);
  const [installationLog, setInstallationLog] = useState<string[]>([]);

  const urlParams = new URLSearchParams(window.location.search);
  const authKey = urlParams.get('key');

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

    try {
      if (config.type === 'supabase') {
        const success = await installSupabaseSchema(config, addLogEntry);
        
        if (success) {
          setInstallationStep('complete');
          toast({
            title: "Instalação concluída",
            description: "Sistema instalado com sucesso",
          });
        } else {
          toast({
            title: "Erro na instalação",
            description: "Falha durante a instalação - verifique o log",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro na instalação';
      addLogEntry(`ERRO CRÍTICO: ${errorMessage}`);
      
      toast({
        title: "Erro na instalação",
        description: errorMessage,
        variant: "destructive",
      });
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
