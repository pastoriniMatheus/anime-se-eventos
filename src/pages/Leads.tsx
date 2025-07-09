import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Copy, Search, Download, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCourses } from '@/hooks/useCourses';
import { useEvents } from '@/hooks/useEvents';
import { useLeads, useLeadStatuses } from '@/hooks/useLeads';
import { usePostgraduateCourses } from '@/hooks/usePostgraduateCourses';
import { useNomenclature } from '@/hooks/useNomenclature';
import { useRealtimeLeads } from '@/hooks/useRealtimeLeads';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import StatusEditor from '@/components/StatusEditor';
import { exportLeadsToCSV } from '@/utils/csvExport';
import { BookOpen, GraduationCap } from 'lucide-react';
import ContactExporter from '@/components/ContactExporter';
import { Layout } from '@/components/Layout';

const Leads = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: leads = [] } = useLeads();
  const { data: courses = [] } = useCourses();
  const { data: events = [] } = useEvents();
  const { data: leadStatuses = [] } = useLeadStatuses();
  const { data: postgraduateCourses = [] } = usePostgraduateCourses();
  const { courseNomenclature, postgraduateNomenclature } = useNomenclature();

  // Habilitar realtime updates
  useRealtimeLeads();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  
  const [newLead, setNewLead] = useState({
    name: '',
    whatsapp: '',
    email: '',
    course_type: 'course',
    course_id: '',
    postgraduate_course_id: '',
    event_id: '',
    status_id: ''
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

    if (isCreatingLead) {
      console.log('[Leads] Já está criando um lead, ignorando clique duplo');
      return;
    }

    setIsCreatingLead(true);

    try {
      console.log('[Leads] Iniciando criação de lead:', newLead);

      // Buscar o status "Pendente" para definir como padrão
      const defaultStatus = leadStatuses.find(status => 
        status.name.toLowerCase() === 'pendente'
      ) || leadStatuses[0];

      const leadData = {
        name: newLead.name,
        whatsapp: newLead.whatsapp.replace(/\D/g, ''),
        email: newLead.email.toLowerCase(),
        course_type: newLead.course_type,
        course_id: newLead.course_type === 'course' && newLead.course_id ? newLead.course_id : null,
        postgraduate_course_id: newLead.course_type === 'postgraduate' && newLead.postgraduate_course_id ? newLead.postgraduate_course_id : null,
        event_id: newLead.event_id || null,
        status_id: newLead.status_id || defaultStatus?.id || null
      };

      console.log('[Leads] Dados para inserção:', leadData);

      const { error } = await supabase
        .from('leads')
        .insert([leadData]);

      if (error) {
        console.error('[Leads] Erro ao criar lead:', error);
        throw error;
      }

      console.log('[Leads] Lead criado com sucesso');

      // Limpar o formulário
      setNewLead({
        name: '',
        whatsapp: '',
        email: '',
        course_type: 'course',
        course_id: '',
        postgraduate_course_id: '',
        event_id: '',
        status_id: ''
      });
      setIsCreateDialogOpen(false);

      toast({
        title: "Lead criado",
        description: "Lead criado com sucesso!",
      });

      // Forçar atualização dos dados
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch (error: any) {
      console.error('[Leads] Erro ao criar lead:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar lead",
        variant: "destructive",
      });
    } finally {
      setIsCreatingLead(false);
    }
  };

  const handleEditLead = async () => {
    if (!editingLead) return;

    try {
      // Buscar o status "Pendente" para casos onde não há status definido
      const defaultStatus = leadStatuses.find(status => 
        status.name.toLowerCase() === 'pendente'
      ) || leadStatuses[0];

      const updateData = {
        name: editingLead.name,
        whatsapp: editingLead.whatsapp.replace(/\D/g, ''),
        email: editingLead.email.toLowerCase(),
        course_type: editingLead.course_type,
        course_id: editingLead.course_type === 'course' ? (editingLead.course_id || null) : null,
        postgraduate_course_id: editingLead.course_type === 'postgraduate' ? (editingLead.postgraduate_course_id || null) : null,
        event_id: editingLead.event_id || null,
        status_id: editingLead.status_id || defaultStatus?.id || null
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
      course_id: lead.course_id || '',
      postgraduate_course_id: lead.postgraduate_course_id || '',
      event_id: lead.event_id || '',
      status_id: lead.status_id || ''
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
    <Layout>
      <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-600">Gerenciamento de Leads</h1>
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <ContactExporter leads={leads} />
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
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
                    disabled={isCreatingLead}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="whatsapp">WhatsApp*</Label>
                  <Input
                    id="whatsapp"
                    value={newLead.whatsapp}
                    onChange={(e) => setNewLead({...newLead, whatsapp: e.target.value})}
                    placeholder="(82) 99999-9999"
                    disabled={isCreatingLead}
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
                    disabled={isCreatingLead}
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
                    disabled={isCreatingLead}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course">{courseNomenclature}</SelectItem>
                      <SelectItem value="postgraduate">{postgraduateNomenclature}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newLead.course_type === 'course' && (
                  <div className="grid gap-2">
                    <Label htmlFor="course">{courseNomenclature.slice(0, -1)}</Label>
                    <Select 
                      value={newLead.course_id} 
                      onValueChange={(value) => setNewLead({...newLead, course_id: value})}
                      disabled={isCreatingLead}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Selecione um ${courseNomenclature.toLowerCase().slice(0, -1)}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum {courseNomenclature.toLowerCase().slice(0, -1)}</SelectItem>
                        {courses.map((course: any) => (
                          <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {newLead.course_type === 'postgraduate' && (
                  <div className="grid gap-2">
                    <Label htmlFor="postgraduate">{postgraduateNomenclature}</Label>
                    <Select 
                      value={newLead.postgraduate_course_id} 
                      onValueChange={(value) => setNewLead({...newLead, postgraduate_course_id: value})}
                      disabled={isCreatingLead}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Selecione uma ${postgraduateNomenclature.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma {postgraduateNomenclature.toLowerCase()}</SelectItem>
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
                    disabled={isCreatingLead}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um evento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum evento</SelectItem>
                      {events.map((event: any) => (
                        <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreatingLead}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateLead} 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isCreatingLead}
                >
                  {isCreatingLead ? 'Criando...' : 'Criar Lead'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Label>{courseNomenclature.slice(0, -1)}</Label>
              <Select value={filterCourse} onValueChange={setFilterCourse}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os {courseNomenclature.toLowerCase()}</SelectItem>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">ID do Lead</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead className="hidden md:table-cell">E-mail</TableHead>
                  <TableHead>{courseNomenclature.slice(0, -1)}</TableHead>
                  <TableHead className="hidden lg:table-cell">Evento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Comprovante</TableHead>
                  <TableHead className="hidden lg:table-cell">Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead: any) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
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
                    <TableCell className="hidden md:table-cell">{lead.email}</TableCell>
                    <TableCell>
                      {lead.course_type === 'postgraduate' ? (
                        <div className="flex items-center space-x-1">
                          <GraduationCap className="h-4 w-4 text-purple-600" />
                          <span className="hidden sm:inline">{lead.postgraduate_course?.name || '-'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          <span className="hidden sm:inline">{lead.course?.name || '-'}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{lead.event?.name || '-'}</TableCell>
                    <TableCell>
                      <StatusEditor leadId={lead.id} currentStatus={lead.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {lead.receipt_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(lead.receipt_url, '_blank')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
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
          </div>
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
                    course_id: '',
                    postgraduate_course_id: ''
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">{courseNomenclature}</SelectItem>
                    <SelectItem value="postgraduate">{postgraduateNomenclature}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingLead.course_type === 'course' && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-course">{courseNomenclature.slice(0, -1)}</Label>
                  <Select 
                    value={editingLead.course_id} 
                    onValueChange={(value) => setEditingLead({...editingLead, course_id: value === 'none' ? '' : value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Selecione um ${courseNomenclature.toLowerCase().slice(0, -1)}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum {courseNomenclature.toLowerCase().slice(0, -1)}</SelectItem>
                      {courses.map((course: any) => (
                        <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {editingLead.course_type === 'postgraduate' && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-postgraduate">{postgraduateNomenclature}</Label>
                  <Select 
                    value={editingLead.postgraduate_course_id} 
                    onValueChange={(value) => setEditingLead({...editingLead, postgraduate_course_id: value === 'none' ? '' : value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Selecione uma ${postgraduateNomenclature.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma {postgraduateNomenclature.toLowerCase()}</SelectItem>
                      {postgraduateCourses.map((course: any) => (
                        <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="edit-event">Evento</Label>
                <Select 
                  value={editingLead.event_id} 
                  onValueChange={(value) => setEditingLead({...editingLead, event_id: value === 'none' ? '' : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum evento</SelectItem>
                    {events.map((event: any) => (
                      <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
    </Layout>
  );
};

export default Leads;
