
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeadStatuses } from '@/hooks/useLeads';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface StatusEditorProps {
  leadId: string;
  currentStatus: any;
}

const StatusEditor = ({ leadId, currentStatus }: StatusEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { data: leadStatuses = [] } = useLeadStatuses();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleStatusChange = async (newStatusId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status_id: newStatusId })
        .eq('id', leadId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsEditing(false);

      toast({
        title: "Status atualizado",
        description: "Status do lead atualizado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar status",
        variant: "destructive",
      });
    }
  };

  if (isEditing) {
    return (
      <Select 
        value={currentStatus?.id || ""} 
        onValueChange={handleStatusChange}
        onOpenChange={(open) => {
          if (!open) setIsEditing(false);
        }}
        defaultOpen={true}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          {leadStatuses.map((status: any) => (
            <SelectItem key={status.id} value={status.id}>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: status.color }}
                />
                {status.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Badge 
      style={{ 
        backgroundColor: currentStatus?.color || '#f59e0b', 
        color: 'white',
        cursor: 'pointer'
      }}
      className="hover:opacity-80 transition-opacity"
      onClick={() => setIsEditing(true)}
    >
      {currentStatus?.name || 'Sem status'}
    </Badge>
  );
};

export default StatusEditor;
