
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { GraduationCap, Save } from 'lucide-react';
import { useSystemSettings, useUpdateSystemSetting } from '@/hooks/useSystemSettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const EnrollmentStatusSettings = () => {
  const [selectedStatusId, setSelectedStatusId] = useState('');
  const { data: settings } = useSystemSettings();
  const updateSetting = useUpdateSystemSetting();
  const { toast } = useToast();

  // Buscar todos os status disponíveis
  const { data: statuses = [] } = useQuery({
    queryKey: ['lead_statuses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_statuses')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Carregar configuração atual
  useEffect(() => {
    if (settings) {
      const enrollmentStatusSetting = settings.find(s => s.key === 'enrollment_status_id');
      if (enrollmentStatusSetting?.value) {
        setSelectedStatusId(enrollmentStatusSetting.value);
      }
    }
  }, [settings]);

  const handleSave = async () => {
    if (!selectedStatusId) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um status",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateSetting.mutateAsync({
        key: 'enrollment_status_id',
        value: selectedStatusId
      });
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    }
  };

  const selectedStatus = statuses.find(s => s.id === selectedStatusId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <GraduationCap className="h-5 w-5" />
          <span>Status de Matrícula</span>
        </CardTitle>
        <CardDescription>
          Defina qual status representa "matrícula" nas métricas do dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="enrollment-status">Status que representa matrícula</Label>
          <Select value={selectedStatusId} onValueChange={setSelectedStatusId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status.id} value={status.id}>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: status.color }}
                    />
                    <span>{status.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedStatus && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Status selecionado:</strong> {selectedStatus.name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Este status será usado para calcular as métricas de matrícula no dashboard
            </p>
          </div>
        )}

        <Button 
          onClick={handleSave} 
          disabled={!selectedStatusId || updateSetting.isPending}
          className="w-full"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateSetting.isPending ? 'Salvando...' : 'Salvar Configuração'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EnrollmentStatusSettings;
