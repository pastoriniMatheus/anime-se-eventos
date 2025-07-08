
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCourses } from '@/hooks/useCourses';
import { useEvents } from '@/hooks/useEvents';
import { usePostgraduateCourses } from '@/hooks/usePostgraduateCourses';
import { useNomenclature } from '@/hooks/useNomenclature';

interface ContactExporterProps {
  leads: any[];
}

const ContactExporter = ({ leads }: ContactExporterProps) => {
  const { toast } = useToast();
  const { data: courses = [] } = useCourses();
  const { data: events = [] } = useEvents();
  const { data: postgraduateCourses = [] } = usePostgraduateCourses();
  const { courseNomenclature, postgraduateNomenclature } = useNomenclature();

  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [selectedValue, setSelectedValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const exportContacts = () => {
    let filteredLeads = [...leads];

    // Aplicar filtros
    if (filterType === 'event' && selectedValue) {
      filteredLeads = leads.filter(lead => lead.event_id === selectedValue);
    } else if (filterType === 'course' && selectedValue) {
      filteredLeads = leads.filter(lead => 
        lead.course_id === selectedValue || lead.postgraduate_course_id === selectedValue
      );
    } else if (filterType === 'date' && startDate && endDate) {
      filteredLeads = leads.filter(lead => {
        // Parse the lead date and normalize to start of day in local timezone
        const leadDate = new Date(lead.created_at);
        const leadDateOnly = new Date(leadDate.getFullYear(), leadDate.getMonth(), leadDate.getDate());
        
        // Parse the filter dates and normalize to start of day in local timezone
        const startDateObj = new Date(startDate + 'T00:00:00');
        const endDateObj = new Date(endDate + 'T23:59:59');
        
        console.log('Filtering lead:', {
          leadCreatedAt: lead.created_at,
          leadDateOnly: leadDateOnly.toISOString(),
          startDate: startDateObj.toISOString(),
          endDate: endDateObj.toISOString(),
          isInRange: leadDateOnly >= new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate()) && 
                     leadDateOnly <= new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate())
        });
        
        return leadDateOnly >= new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate()) && 
               leadDateOnly <= new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());
      });
    }

    if (filteredLeads.length === 0) {
      toast({
        title: "Nenhum contato encontrado",
        description: "Não há contatos para exportar com os filtros selecionados.",
        variant: "destructive",
      });
      return;
    }

    // Criar CSV
    const headers = ['Nome', 'Email', 'WhatsApp', 'Curso', 'Evento', 'Status', 'Turno', 'Data de Criação'];
    
    const csvContent = [
      headers.join(','),
      ...filteredLeads.map(lead => [
        `"${lead.name}"`,
        `"${lead.email}"`,
        `"${lead.whatsapp}"`,
        `"${lead.course?.name || lead.postgraduate_course?.name || ''}"`,
        `"${lead.event?.name || ''}"`,
        `"${lead.status?.name || ''}"`,
        `"${lead.shift || ''}"`,
        `"${new Date(lead.created_at).toLocaleDateString('pt-BR')}"`
      ].join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Nome do arquivo baseado no filtro
    let fileName = 'contatos_';
    if (filterType === 'event' && selectedValue) {
      const eventName = events.find(e => e.id === selectedValue)?.name || 'evento';
      fileName += `${eventName.replace(/\s+/g, '-').toLowerCase()}_`;
    } else if (filterType === 'course' && selectedValue) {
      const courseName = [...courses, ...postgraduateCourses].find(c => c.id === selectedValue)?.name || 'curso';
      fileName += `${courseName.replace(/\s+/g, '-').toLowerCase()}_`;
    } else if (filterType === 'date') {
      fileName += `${startDate}_${endDate}_`;
    }
    fileName += `${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsOpen(false);
    toast({
      title: "Contatos exportados",
      description: `${filteredLeads.length} contatos exportados com sucesso!`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-green-600 hover:bg-green-700 text-white">
          <Download className="h-4 w-4 mr-2" />
          Exportar Contatos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exportar Contatos</DialogTitle>
          <DialogDescription>
            Escolha como deseja filtrar os contatos para exportação
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="filterType">Filtrar por</Label>
            <Select value={filterType} onValueChange={(value) => {
              setFilterType(value);
              setSelectedValue('');
              setStartDate('');
              setEndDate('');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de filtro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os contatos</SelectItem>
                <SelectItem value="event">Por evento</SelectItem>
                <SelectItem value="course">Por {courseNomenclature.toLowerCase().slice(0, -1)}</SelectItem>
                <SelectItem value="date">Por data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filterType === 'event' && (
            <div className="grid gap-2">
              <Label htmlFor="event">Evento</Label>
              <Select value={selectedValue} onValueChange={setSelectedValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um evento" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event: any) => (
                    <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filterType === 'course' && (
            <div className="grid gap-2">
              <Label htmlFor="course">{courseNomenclature.slice(0, -1)}</Label>
              <Select value={selectedValue} onValueChange={setSelectedValue}>
                <SelectTrigger>
                  <SelectValue placeholder={`Selecione um ${courseNomenclature.toLowerCase().slice(0, -1)}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{courseNomenclature}</SelectLabel>
                    {courses.map((course: any) => (
                      <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>{postgraduateNomenclature}</SelectLabel>
                    {postgraduateCourses.map((course: any) => (
                      <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}

          {filterType === 'date' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Data inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">Data final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            {filterType === 'all' && `Total de contatos: ${leads.length}`}
            {filterType === 'event' && selectedValue && 
              `Contatos do evento: ${leads.filter(l => l.event_id === selectedValue).length}`
            }
            {filterType === 'course' && selectedValue && 
              `Contatos do ${courseNomenclature.toLowerCase().slice(0, -1)}: ${leads.filter(l => l.course_id === selectedValue || l.postgraduate_course_id === selectedValue).length}`
            }
            {filterType === 'date' && startDate && endDate && (() => {
              const count = leads.filter(l => {
                const leadDate = new Date(l.created_at);
                const leadDateOnly = new Date(leadDate.getFullYear(), leadDate.getMonth(), leadDate.getDate());
                const startDateObj = new Date(startDate + 'T00:00:00');
                const endDateObj = new Date(endDate + 'T23:59:59');
                return leadDateOnly >= new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate()) && 
                       leadDateOnly <= new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());
              }).length;
              return `Contatos no período: ${count}`;
            })()}
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={exportContacts} className="bg-green-600 hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactExporter;
