
export interface DatabaseConfig {
  type: 'supabase' | 'postgresql';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceKey?: string;
}

export type InstallationStep = 'config' | 'verify' | 'install' | 'complete';
