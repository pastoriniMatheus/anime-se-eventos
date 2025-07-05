
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatabaseConfig } from '@/types/database';

interface DatabaseConfigFormProps {
  config: DatabaseConfig;
  setConfig: (config: DatabaseConfig) => void;
}

const DatabaseConfigForm: React.FC<DatabaseConfigFormProps> = ({ config, setConfig }) => {
  return (
    <Tabs value={config.type} onValueChange={(value: any) => setConfig({ ...config, type: value })}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="supabase">Supabase</TabsTrigger>
        <TabsTrigger value="postgresql">PostgreSQL</TabsTrigger>
      </TabsList>

      <TabsContent value="supabase" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="supabase-url">URL do Projeto Supabase</Label>
          <Input
            id="supabase-url"
            placeholder="https://xyz.supabase.co"
            value={config.supabaseUrl || ''}
            onChange={(e) => setConfig({ ...config, supabaseUrl: e.target.value })}
          />
          <p className="text-xs text-gray-500">Exemplo: https://abc123.supabase.co</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="supabase-anon">Anon Key (Opcional)</Label>
          <Input
            id="supabase-anon"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
            value={config.supabaseAnonKey || ''}
            onChange={(e) => setConfig({ ...config, supabaseAnonKey: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supabase-service">Service Role Key *</Label>
          <Input
            id="supabase-service"
            type="password"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
            value={config.supabaseServiceKey || ''}
            onChange={(e) => setConfig({ ...config, supabaseServiceKey: e.target.value })}
          />
          <p className="text-xs text-gray-500">Necessário para criar/modificar tabelas - deve começar com "eyJ"</p>
        </div>
      </TabsContent>

      <TabsContent value="postgresql" className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            PostgreSQL customizado ainda não está implementado. Use Supabase por enquanto.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default DatabaseConfigForm;
