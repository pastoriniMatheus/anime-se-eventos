import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Copy, Search, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCourses } from '@/hooks/useCourses';
import { useEvents } from '@/hooks/useEvents';
import { useLeads, useLeadStatuses } from '@/hooks/useLeads';
import { usePostgraduateCourses } from '@/hooks/usePostgraduateCourses';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import StatusEditor from '@/components/StatusEditor';
import { exportLeadsToCSV } from '@/utils/csvExport';
import { BookOpen, GraduationCap } from 'lucide-react';
import ContactExporter from '@/components/ContactExporter';

const Leads = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: leads = [] } = useLeads();
  const { data: courses = [] } = useCourses();
  const { data: events = [] } = useEvents();
  const { data: leadStatuses = [] } = useLeadStatuses();
  const { data: postgraduateCourses = [] } = usePostgraduateCourses();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [newLead, setNewLead] = useState({
    name: '',
    whatsapp: '',
    email: '',
    course_type: 'course',
    course_id: '',
    postgraduate_course_id: '',
    event_id: '',
    status_id: '',
    shift: ''
  });

  const handleCreateLead = async () => {
    if (!newLead.name || !newLead.whatsapp || !newLead.email) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const leadData = {
        name: newLead.name,
        whatsapp: newLead.whatsapp.replace(/\D/g, ''),
        email: newLead.email.toLowerCase(),
        course_type: newLead.course_type,
        course_id: newLead.course_type === 'course' ? (newLead.course_id || null) : null,
        postgraduate_course_id: newLead.course_type === 'postgraduate' ? (newLead.postgraduate_course_id || null) : null,
        event_id: newLead.event_id || null,
        status_id: newLead.status_id || leadStatuses[0]?.id,
        shift: newLead.shift || null
      };

      const { error } = await supabase
        .from('leads')
        .insert([leadData]);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setNewLead({
        name: '',
        whatsapp: '',
        email: '',
        course_type: 'course',
        course_id: '',
        postgraduate_course_id: '',
        event_id: '',
        status_id: '',
        shift: ''
      });
      setIsCreateDialogOpen(false);

      toast({
        title: "Lead criado",
        description: "Lead criado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar lead",
        variant: "destructive",
      });
    }
  };

  const handleEditLead = async () => {
    if (!editingLead) return;

    try {
      const updateData = {
        name: editingLead.name,
        whatsapp: editingLead.whatsapp.replace(/\D/g, ''),
        email: editingLead.email.toLowerCase(),
        course_type: editingLead.course_type,
        course_id: editingLead.course_type === 'course' ? (editingLead.course_id === 'none' ? null : editingLead.course_id) : null,
        postgraduate_course_id: editingLead.course_type === 'postgraduate' ? (editingLead.postgraduate_course_id === 'none' ? null : editingLead.postgraduate_course_id) : null,
        event_id: editingLead.event_id || null,
        status_id: editingLead.status_id,
        shift: editingLead.shift === 'none' ? null : editingLead.shift
      };

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', editingLead.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsEditDialogOpen(false);
      setEditingLead(null);

      toast({
        title: "Lead atualizado",
        description: "Lead atualizado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar lead",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['leads'] });

      toast({
        title: "Lead removido",
        description: "Lead removido com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover lead",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copiado!",
        description: `${type} copiado para a área de transferência.`,
      });
    });
  };

  const openEditDialog = (lead: any) => {
    setEditingLead({
      ...lead,
      course_type: lead.course_type || 'course',
      course_id: lead.course_id || 'none',
      postgraduate_course_id: lead.postgraduate_course_id || 'none',
      event_id: lead.event_id || '',
      status_id: lead.status_id || '',
      shift: lead.shift || 'none'
    });
    setIsEditDialogOpen(true);
  };

  const handleExportCSV = () => {
    exportLeadsToCSV(filteredLeads);
    toast({
      title: "Exportação concluída",
      description: "Os leads foram exportados para CSV com sucesso!",
    });
  };

  // Filter leads based on search and filters
  const filteredLeads = leads.filter((lead: any) => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.whatsapp.includes(searchTerm);
    
    const matchesCourse = filterCourse === 'all' || lead.course_id === filterCourse;
    const matchesStatus = filterStatus === 'all' || lead.status_id === filterStatus;
    
    return matchesSearch && matchesCourse && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-blue-600">Gerenciamento de Leads</h1>
        <div className="flex space-x-2">
          <ContactExporter leads={leads} />
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                <span>Novo Lead</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Lead</DialogTitle>
                <DialogDescription>
                  Adicione um novo lead ao sistema
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome*</Label>
                  <Input
                    id="name"
                    value={newLead.name}
                    onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                    placeholder="João Silva"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="whatsapp">WhatsApp*</Label>
                  <Input
                    id="whatsapp"
                    value={newLead.whatsapp}
                    onChange={(e) => setNewLead({...newLead, whatsapp: e.target.value})}
                    placeholder="(82) 99999-9999"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail*</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                    placeholder="joao@email.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="course_type">Tipo de interesse</Label>
                  <Select 
                    value={newLead.course_type} 
                    onValueChange={(value) => setNewLead({
                      ...newLead, 
                      course_type: value,
                      course_id: '',
                      postgraduate_course_id: ''
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course">Curso de Graduação</SelectItem>
                      <SelectItem value="postgraduate">Pós-graduação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newLead.course_type === 'course' && (
                  <div className="grid gap-2">
                    <Label htmlFor="course">Curso</Label>
                    <Select 
                      value={newLead.course_id} 
                      onValueChange={(value) => setNewLead({...newLead, course_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um curso" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course: any) => (
                          <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {newLead.course_type === 'postgraduate' && (
                  <div className="grid gap-2">
                    <Label htmlFor="postgraduate">Pós-graduação</Label>
                    <Select 
                      value={newLead.postgraduate_course_id} 
                      onValueChange={(value) => setNewLead({...newLead, postgraduate_course_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma pós-graduação" />
                      </SelectTrigger>
                      <SelectContent>
                        {postgraduateCourses.map((course: any) => (
                          <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="event">Evento</Label>
                  <Select 
                    value={newLead.event_id} 
                    onValueChange={(value) => setNewLead({...newLead, event_id: value})}
                  >
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
                <div className="grid gap-2">
                  <Label htmlFor="shift">Turno</Label>
                  <Select 
                    value={newLead.shift} 
                    onValueChange={(value) => setNewLead({...newLead, shift: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um turno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manhã">Manhã</SelectItem>
                      <SelectItem value="tarde">Tarde</SelectItem>
                      <SelectItem value="noite">Noite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateLead} className="bg-blue-600 hover:bg-blue-700">
                  Criar Lead
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-600">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome, email ou WhatsApp..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Curso</Label>
              <Select value={filterCourse} onValueChange={setFilterCourse}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cursos</SelectItem>
                  {courses.map((course: any) => (
                    <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {leadStatuses.map((status: any) => (
                    <SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Exportação Rápida</Label>
              <Button variant="outline" className="w-full" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-600">Leads ({filteredLeads.length})</CardTitle>
          <CardDescription>
            Gerencie todos os leads do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>ID do Lead</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead: any) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {lead.id}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(lead.id, 'ID do Lead')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{lead.whatsapp}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>
                    {lead.course_type === 'postgraduate' ? (
                      <div className="flex items-center space-x-1">
                        <GraduationCap className="h-4 w-4 text-purple-600" />
                        <span>{lead.postgraduate_course?.name || '-'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <span>{lead.course?.name || '-'}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{lead.event?.name || '-'}</TableCell>
                  <TableCell>
                    {lead.status ? (
                      <StatusEditor leadId={lead.id} currentStatus={lead.status} />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{lead.shift || '-'}</TableCell>
                  <TableCell>
                    {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(lead)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLead(lead.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredLeads.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm || filterCourse !== 'all' || filterStatus !== 'all' 
                  ? 'Nenhum lead encontrado com os filtros aplicados.'
                  : 'Nenhum lead criado ainda. Clique em "Novo Lead" para começar.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
            <DialogDescription>
              Atualize as informações do lead
            </DialogDescription>
          </DialogHeader>
          {editingLead && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nome*</Label>
                <Input
                  id="edit-name"
                  value={editingLead.name}
                  onChange={(e) => setEditingLead({...editingLead, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-whatsapp">WhatsApp*</Label>
                <Input
                  id="edit-whatsapp"
                  value={editingLead.whatsapp}
                  onChange={(e) => setEditingLead({...editingLead, whatsapp: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">E-mail*</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingLead.email}
                  onChange={(e) => setEditingLead({...editingLead, email: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-course_type">Tipo de interesse</Label>
                <Select 
                  value={editingLead.course_type} 
                  onValueChange={(value) => setEditingLead({
                    ...editingLead, 
                    course_type: value,
                    course_id: 'none',
                    postgraduate_course_id: 'none'
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">Curso de Graduação</SelectItem>
                    <SelectItem value="postgraduate">Pós-graduação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingLead.course_type === 'course' && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-course">Curso</Label>
                  <Select 
                    value={editingLead.course_id} 
                    onValueChange={(value) => setEditingLead({...editingLead, course_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um curso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum curso</SelectItem>
                      {courses.map((course: any) => (
                        <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {editingLead.course_type === 'postgraduate' && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-postgraduate">Pós-graduação</Label>
                  <Select 
                    value={editingLead.postgraduate_course_id} 
                    onValueChange={(value) => setEditingLead({...editingLead, postgraduate_course_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma pós-graduação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma pós-graduação</SelectItem>
                      {postgraduateCourses.map((course: any) => (
                        <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={editingLead.status_id} 
                  onValueChange={(value) => setEditingLead({...editingLead, status_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadStatuses.map((status: any) => (
                      <SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-shift">Turno</Label>
                <Select 
                  value={editingLead.shift} 
                  onValueChange={(value) => setEditingLead({...editingLead, shift: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum turno</SelectItem>
                    <SelectItem value="manhã">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                    <SelectItem value="noite">Noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditLead} className="bg-blue-600 hover:bg-blue-700">
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leads;
