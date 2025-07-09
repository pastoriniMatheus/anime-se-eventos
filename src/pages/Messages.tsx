
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MessageSquare, Send, History, Trash2, Users, Eye, Copy, CheckCircle, XCircle, Clock, Smile, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMessageTemplates, useMessageHistory, useCreateMessageTemplate } from '@/hooks/useMessages';
import { useClearMessageHistory } from '@/hooks/useMessageRecipients';
import { useCourses } from '@/hooks/useCourses';
import { useEvents } from '@/hooks/useEvents';
import { useLeads } from '@/hooks/useLeads';
import { supabase } from '@/integrations/supabase/client';
import MessageMetrics from '@/components/MessageMetrics';
import MessageRecipientsModal from '@/components/MessageRecipientsModal';
import EmojiPicker from '@/components/EmojiPicker';

const Messages = () => {
  const { toast } = useToast();
  const [messageContent, setMessageContent] = useState('');
  const [messageType, setMessageType] = useState('whatsapp');
  const [filterType, setFilterType] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [onlyUndelivered, setOnlyUndelivered] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [leadStatuses, setLeadStatuses] = useState<any[]>([]);

  const { data: templates, refetch: refetchTemplates } = useMessageTemplates();
  const { data: messageHistory } = useMessageHistory();
  const { data: courses } = useCourses();
  const { data: events } = useEvents();
  const { data: leads } = useLeads();
  const createTemplate = useCreateMessageTemplate();
  const clearHistory = useClearMessageHistory();

  // Carregar status dos leads
  React.useEffect(() => {
    const fetchLeadStatuses = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('lead_statuses')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setLeadStatuses(data || []);
      } catch (error) {
        console.error('Erro ao carregar status dos leads:', error);
      }
    };

    fetchLeadStatuses();
  }, []);

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem",
        variant: "destructive",
      });
      return;
    }

    try {
      // Buscar configurações de webhook
      const { data: settings } = await (supabase as any)
        .from('system_settings')
        .select('*')
        .eq('key', 'webhook_urls')
        .single();

      let webhookUrl = '';
      if (settings?.value) {
        const webhookUrls = typeof settings.value === 'string' 
          ? JSON.parse(settings.value) 
          : settings.value;
        webhookUrl = webhookUrls[messageType] || '';
      }

      if (!webhookUrl) {
        toast({
          title: "Erro",
          description: `Webhook para ${messageType} não configurado. Configure em Configurações > Webhooks`,
          variant: "destructive",
        });
        return;
      }

      // Filtrar destinatários
      let filteredLeads = leads || [];
      
      if (filterType === 'course' && filterValue) {
        filteredLeads = filteredLeads.filter((lead: any) => lead.course_id === filterValue);
      } else if (filterType === 'event' && filterValue) {
        filteredLeads = filteredLeads.filter((lead: any) => lead.event_id === filterValue);
      } else if (filterType === 'status' && filterValue) {
        filteredLeads = filteredLeads.filter((lead: any) => lead.status_id === filterValue);
      }

      if (filteredLeads.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhum destinatário encontrado com os filtros aplicados",
          variant: "destructive",
        });
        return;
      }

      // Criar histórico da mensagem
      const { data: messageHistoryData, error: messageError } = await (supabase as any)
        .from('message_history')
        .insert([{
          type: messageType,
          content: messageContent,
          filter_type: filterType,
          filter_value: filterValue,
          recipients_count: filteredLeads.length,
          status: 'sending'
        }])
        .select()
        .single();

      if (messageError) throw messageError;

      // Criar registros de destinatários
      const recipients = filteredLeads.map((lead: any) => ({
        message_history_id: messageHistoryData.id,
        lead_id: lead.id,
        delivery_status: 'pending'
      }));

      await (supabase as any)
        .from('message_recipients')
        .insert(recipients);

      // Enviar webhook - CORRIGIDO: usar window.location.origin ao invés de process.env
      const webhookData = {
        type: messageType,
        content: messageContent,
        recipients: filteredLeads.map((lead: any) => ({
          name: lead.name,
          email: lead.email,
          whatsapp: lead.whatsapp
        })),
        message_id: messageHistoryData.id
      };

      const response = await fetch('/functions/v1/send-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6bmZya2RzbWJ0eW5taWZxY2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzIzOTAsImV4cCI6MjA2NzMwODM5MH0.8Rqh2hxan513BDqxDSYM_sy8O-hEPlAb9OLL166BzIQ'
        },
        body: JSON.stringify({
          webhook_url: webhookUrl,
          webhook_data: webhookData
        })
      });

      if (response.ok) {
        // Atualizar status da mensagem
        await (supabase as any)
          .from('message_history')
          .update({ status: 'sent' })
          .eq('id', messageHistoryData.id);

        toast({
          title: "Mensagem enviada",
          description: `Mensagem enviada para ${filteredLeads.length} destinatários!`,
        });
        setMessageContent('');
        setTemplateName('');
      } else {
        throw new Error('Erro ao enviar webhook');
      }
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar mensagem",
        variant: "destructive",
      });
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !messageContent.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome e conteúdo para o template",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTemplate.mutateAsync({
        name: templateName,
        content: messageContent,
        type: messageType
      });
      setTemplateName('');
      setMessageContent('');
    } catch (error) {
      console.error('Erro ao salvar template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('message_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      // Recarregar templates após deletar
      await refetchTemplates();

      toast({
        title: "Template excluído",
        description: "Template excluído com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir template",
        variant: "destructive",
      });
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearHistory.mutateAsync();
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
    }
  };

  const copyDeliveryCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado",
      description: "Código de entrega copiado para a área de transferência",
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Enviado</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Falhou</Badge>;
      case 'sending':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Enviando</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Central de Mensagens</h1>
          <p className="text-gray-600 mt-1">Envie mensagens para seus leads e acompanhe o histórico</p>
        </div>
      </div>

      {/* Métricas */}
      <MessageMetrics />

      <Tabs defaultValue="send" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="send" className="flex items-center space-x-2">
            <Send className="h-4 w-4" />
            <span>Enviar Mensagem</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Templates</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span>Histórico</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>Nova Mensagem</CardTitle>
              <CardDescription>
                Envie mensagens personalizadas para seus leads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="messageType">Tipo de Mensagem</Label>
                  <Select value={messageType} onValueChange={setMessageType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filterType">Filtrar Por</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Leads</SelectItem>
                      <SelectItem value="course">Por Curso</SelectItem>
                      <SelectItem value="event">Por Evento</SelectItem>
                      <SelectItem value="status">Por Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filterType !== 'all' && (
                  <div className="space-y-2">
                    <Label htmlFor="filterValue">
                      {filterType === 'course' ? 'Curso' : 
                       filterType === 'event' ? 'Evento' : 'Status'}
                    </Label>
                    <Select value={filterValue} onValueChange={setFilterValue}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Selecione um ${
                          filterType === 'course' ? 'curso' : 
                          filterType === 'event' ? 'evento' : 'status'
                        }`} />
                      </SelectTrigger>
                      <SelectContent>
                        {filterType === 'course' ? 
                          courses?.map((course: any) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.name}
                            </SelectItem>
                          )) :
                          filterType === 'event' ?
                          events?.map((event: any) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.name}
                            </SelectItem>
                          )) :
                          leadStatuses?.map((status: any) => (
                            <SelectItem key={status.id} value={status.id}>
                              {status.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="onlyUndelivered" 
                  checked={onlyUndelivered}
                  onCheckedChange={(checked) => setOnlyUndelivered(checked === true)}
                />
                <Label htmlFor="onlyUndelivered">
                  Enviar apenas para contatos que ainda não receberam mensagem
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateName">Nome do Template (para salvar)</Label>
                <Input
                  id="templateName"
                  placeholder="Digite o nome do template"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="messageContent">Conteúdo da Mensagem</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEmojiPicker(true)}
                  >
                    <Smile className="h-4 w-4 mr-2" />
                    Emojis
                  </Button>
                </div>
                <Textarea
                  id="messageContent"
                  placeholder="Digite sua mensagem aqui..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleSendMessage} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Mensagem
                </Button>
                <Button variant="outline" onClick={handleSaveTemplate}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Mensagem</CardTitle>
              <CardDescription>
                Gerencie seus templates de mensagem
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templates && templates.length > 0 ? (
                <div className="grid gap-4">
                  {templates.map((template: any) => (
                    <div key={template.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{template.name}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{template.type}</Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o template "{template.name}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTemplate(template.id)}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{template.content}</p>
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => setMessageContent(template.content)}
                      >
                        Usar Template
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Nenhum template encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Histórico de Mensagens</CardTitle>
                  <CardDescription>
                    Visualize todas as mensagens enviadas
                  </CardDescription>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpar Histórico
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação irá remover todo o histórico de mensagens permanentemente. 
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearHistory}>
                        Limpar Histórico
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              {messageHistory && messageHistory.length > 0 ? (
                <div className="space-y-4">
                  {messageHistory.map((message: any) => (
                    <div key={message.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{message.type}</Badge>
                          {getStatusBadge(message.status)}
                          <span className="text-sm text-gray-600">
                            {new Date(message.sent_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMessage(message);
                              setShowRecipientsModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Destinatários ({message.recipients_count})
                          </Button>
                          {message.delivery_code && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyDeliveryCode(message.delivery_code)}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Código
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm mb-2">{message.content}</p>
                      
                      {message.delivery_code && (
                        <div className="text-xs text-gray-500">
                          Código de entrega: <code className="bg-gray-100 px-1 rounded">{message.delivery_code}</code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma mensagem enviada ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Destinatários */}
      <MessageRecipientsModal
        isOpen={showRecipientsModal}
        onClose={() => setShowRecipientsModal(false)}
        messageHistory={selectedMessage}
      />

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
};

export default Messages;
