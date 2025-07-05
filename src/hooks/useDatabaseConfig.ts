
import { useState, useEffect } from 'react';

interface DatabaseConfig {
  type: 'supabase' | 'postgresql' | 'mysql';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceKey?: string;
  active?: boolean;
  name?: string;
}

export const useDatabaseConfig = () => {
  const [configs, setConfigs] = useState<DatabaseConfig[]>([]);
  const [activeConfig, setActiveConfig] = useState<DatabaseConfig | null>(null);

  useEffect(() => {
    // Carregar configurações do localStorage
    const savedConfigs = localStorage.getItem('database-configs');
    if (savedConfigs) {
      try {
        const parsed = JSON.parse(savedConfigs);
        setConfigs(parsed);
        
        const active = parsed.find((config: DatabaseConfig) => config.active);
        if (active) {
          setActiveConfig(active);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações do banco:', error);
      }
    }
  }, []);

  const saveConfig = (config: DatabaseConfig) => {
    const newConfigs = [...configs, { ...config, active: true }];
    
    // Desativar outras configurações
    newConfigs.forEach(c => {
      if (c !== config) c.active = false;
    });

    setConfigs(newConfigs);
    setActiveConfig(config);
    
    // Salvar no localStorage
    localStorage.setItem('database-configs', JSON.stringify(newConfigs));
  };

  const removeConfig = (configToRemove: DatabaseConfig) => {
    const newConfigs = configs.filter(c => c !== configToRemove);
    setConfigs(newConfigs);
    
    if (activeConfig === configToRemove) {
      const newActive = newConfigs.find(c => c.active) || null;
      setActiveConfig(newActive);
    }
    
    localStorage.setItem('database-configs', JSON.stringify(newConfigs));
  };

  const setActive = (config: DatabaseConfig) => {
    const newConfigs = configs.map(c => ({
      ...c,
      active: c === config
    }));
    
    setConfigs(newConfigs);
    setActiveConfig(config);
    localStorage.setItem('database-configs', JSON.stringify(newConfigs));
  };

  const testConnection = async (config: DatabaseConfig): Promise<boolean> => {
    try {
      // Implementar teste de conexão real
      console.log('Testing connection to:', config);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  };

  return {
    configs,
    activeConfig,
    saveConfig,
    removeConfig,
    setActive,
    testConnection
  };
};
