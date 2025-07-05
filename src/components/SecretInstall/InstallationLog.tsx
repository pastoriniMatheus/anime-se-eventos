
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface InstallationLogProps {
  installationLog: string[];
}

const InstallationLog: React.FC<InstallationLogProps> = ({ installationLog }) => {
  const [copied, setCopied] = useState(false);

  if (installationLog.length === 0) {
    return null;
  }

  // Verificar se há SQL para copiar (quando aparece a mensagem de schema completo)
  const hasSQL = installationLog.some(log => log.includes('-- SCHEMA COMPLETO PARA COPIAR E COLAR:'));
  
  // Extrair apenas o SQL das linhas do log
  const extractSQL = () => {
    let sqlStarted = false;
    const sqlLines: string[] = [];
    
    for (const log of installationLog) {
      // Remover timestamp do início da linha
      const cleanLog = log.replace(/^\d{2}:\d{2}:\d{2}: /, '');
      
      if (cleanLog.includes('-- SCHEMA COMPLETO PARA COPIAR E COLAR:')) {
        sqlStarted = true;
        continue;
      }
      
      if (sqlStarted) {
        // Parar quando chegar na mensagem de fim
        if (cleanLog.includes('🔄 Após executar todo o SQL acima')) {
          break;
        }
        
        // Adicionar apenas linhas que parecem SQL (não mensagens de log)
        if (cleanLog.trim() && !cleanLog.startsWith('📋') && !cleanLog.startsWith('⚠️')) {
          sqlLines.push(cleanLog);
        }
      }
    }
    
    return sqlLines.join('\n');
  };

  const copySQL = async () => {
    const sql = extractSQL();
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar SQL:', error);
    }
  };

  return (
    <div className="bg-gray-50 border rounded-lg p-4 max-h-64 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">Log de Instalação:</h4>
        {hasSQL && (
          <Button
            onClick={copySQL}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar SQL
              </>
            )}
          </Button>
        )}
      </div>
      <div className="space-y-1 text-sm font-mono">
        {installationLog.map((log, index) => (
          <div key={index} className="text-gray-700">{log}</div>
        ))}
      </div>
      {hasSQL && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <p className="text-blue-800 font-medium mb-1">Instruções:</p>
          <p className="text-blue-700">
            1. Clique em "Copiar SQL" acima<br/>
            2. Vá para o SQL Editor do seu Supabase<br/>
            3. Cole e execute o código SQL<br/>
            4. Volte aqui e tente a instalação novamente
          </p>
        </div>
      )}
    </div>
  );
};

export default InstallationLog;
