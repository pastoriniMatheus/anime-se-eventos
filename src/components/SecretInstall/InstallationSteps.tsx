
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Server, Database, Loader2 } from 'lucide-react';
import { InstallationStep } from '@/types/database';
import DatabaseConfigForm from './DatabaseConfigForm';
import { DatabaseConfig } from '@/types/database';

interface InstallationStepsProps {
  installationStep: InstallationStep;
  config: DatabaseConfig;
  setConfig: (config: DatabaseConfig) => void;
  isLoading: boolean;
  existingTables: string[];
  onTestConnection: () => void;
  onStartInstallation: () => void;
}

const InstallationSteps: React.FC<InstallationStepsProps> = ({
  installationStep,
  config,
  setConfig,
  isLoading,
  existingTables,
  onTestConnection,
  onStartInstallation
}) => {
  if (installationStep === 'config') {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Configure as credenciais do banco onde o sistema será instalado.
            Todas as tabelas e estruturas necessárias serão criadas automaticamente.
          </p>
        </div>
        
        <DatabaseConfigForm config={config} setConfig={setConfig} />

        <Button 
          onClick={onTestConnection} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testando conexão...
            </>
          ) : (
            <>
              <Server className="h-4 w-4 mr-2" />
              Testar Conexão
            </>
          )}
        </Button>
      </div>
    );
  }

  if (installationStep === 'verify') {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            Conexão estabelecida com sucesso! Pronto para instalação.
          </p>
        </div>

        {existingTables.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 mb-2">
              Tabelas existentes encontradas:
            </h4>
            <div className="flex flex-wrap gap-1">
              {existingTables.map(table => (
                <Badge key={table} variant="secondary">{table}</Badge>
              ))}
            </div>
            <p className="text-xs text-amber-700 mt-2">
              As tabelas serão recriadas durante a instalação
            </p>
          </div>
        )}

        <Button 
          onClick={onStartInstallation}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Instalando...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Iniciar Instalação
            </>
          )}
        </Button>
      </div>
    );
  }

  if (installationStep === 'install') {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Instalação em andamento... Por favor, aguarde.
          </p>
        </div>
      </div>
    );
  }

  if (installationStep === 'complete') {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">
            ✅ Instalação concluída com sucesso!
          </h4>
          <p className="text-sm text-green-700">
            O sistema foi instalado no banco de dados configurado.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Credenciais de acesso:</h4>
          <p className="text-sm text-blue-700">
            <strong>Usuário:</strong> synclead<br />
            <strong>Senha:</strong> s1ncl3@d
          </p>
        </div>

        <Button 
          onClick={() => window.location.href = '/login'}
          className="w-full"
        >
          Ir para Login
        </Button>
      </div>
    );
  }

  return null;
};

export default InstallationSteps;
