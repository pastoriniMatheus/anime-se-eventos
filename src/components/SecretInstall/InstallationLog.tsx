
import React from 'react';

interface InstallationLogProps {
  installationLog: string[];
}

const InstallationLog: React.FC<InstallationLogProps> = ({ installationLog }) => {
  if (installationLog.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 border rounded-lg p-4 max-h-64 overflow-y-auto">
      <h4 className="font-medium mb-2">Log de Instalação:</h4>
      <div className="space-y-1 text-sm font-mono">
        {installationLog.map((log, index) => (
          <div key={index} className="text-gray-700">{log}</div>
        ))}
      </div>
    </div>
  );
};

export default InstallationLog;
