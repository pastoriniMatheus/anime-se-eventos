
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Loader2 } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useLeads } from '@/hooks/useLeads';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const EventReportGenerator = () => {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { data: events = [] } = useEvents();
  const { data: leads = [] } = useLeads();
  const { toast } = useToast();

  const generatePDFReport = async () => {
    if (!selectedEvent) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um evento.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      console.log('[EventReportGenerator] Iniciando geração de relatório para evento:', selectedEvent);

      const { data, error } = await supabase.functions.invoke('generate-event-report', {
        body: {
          event_id: selectedEvent
        }
      });

      if (error) {
        console.error('[EventReportGenerator] Erro na função:', error);
        throw new Error(error.message || 'Erro ao gerar relatório');
      }

      if (!data) {
        throw new Error('Nenhum dado retornado da função');
      }

      console.log('[EventReportGenerator] Relatório gerado com sucesso');

      // Criar nova janela com o relatório HTML
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(data);
        newWindow.document.close();
        
        // Aguardar carregamento e imprimir
        newWindow.onload = () => {
          setTimeout(() => {
            newWindow.print();
          }, 1000);
        };
      } else {
        // Fallback: criar blob e baixar
        const blob = new Blob([data], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-evento-${selectedEvent}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Relatório gerado",
        description: "O relatório foi aberto em uma nova janela. Use Ctrl+P para imprimir como PDF.",
      });

      setIsDialogOpen(false);
      setSelectedEvent('');
    } catch (error: any) {
      console.error('[EventReportGenerator] Erro:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: error.message || "Erro interno do servidor",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <FileText className="h-4 w-4" />
          <span>Relatório por Evento</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Gerar Relatório de Evento</DialogTitle>
          <DialogDescription>
            Selecione um evento para gerar um relatório em PDF
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Evento</label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um evento" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event: any) => {
                  const eventLeads = leads.filter(lead => lead.event_id === event.id);
                  return (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name} ({eventLeads.length} leads)
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setIsDialogOpen(false)}
            disabled={isGenerating}
          >
            Cancelar
          </Button>
          <Button 
            onClick={generatePDFReport} 
            disabled={isGenerating || !selectedEvent}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              'Gerar Relatório'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventReportGenerator;
