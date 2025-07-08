import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLeads } from '@/hooks/useLeads';
import { useCourses } from '@/hooks/useCourses';
import { useEvents } from '@/hooks/useEvents';
import { useMessageTemplates, useMessageHistory, useCreateMessageTemplate } from '@/hooks/useMessages';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { 
  Send, 
  MessageSquare, 
  Mail, 
  Smartphone, 
  Users, 
  Calendar, 
  BookOpen,
  Plus,
  History,
  Filter,
  Eye,
  Save
} from 'lucide-react';

const Messages = () => {
  const [messageContent, setMessageContent] = useState('');
  const [messageType, setMessageType] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [filterType, setFilterType] = useState<'all' | 'course' | 'event'>('all');
  const [filterValue, setFilterValue] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: leads = [] } = useLeads();
  const { data: courses = [] } = useCourses();
  const { data: events = [] } = useEvents();
  const { data: templates = [] } = useMessageTemplates();
  const { data: messageHistory = [] } = useMessageHistory();
  const { mutate: createTemplate } = useCreateMessageTemplate();
  const { data: settings = [] } = useSystemSettings();
  const { toast } = useToast();

  const getFilteredLeads = () => {
    let filtered = leads;

    if (filterType === 'course' && filterValue) {
      filtered = leads.filter(lead => lead.course_id === filterValue);
    } else if (filterType === 'event' && filterValue) {
      filtered = leads.filter(lead => lead.event_id === filterValue);
    }

    return filtered;
  };

  const filteredLeads = getFilteredLeads();

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessageContent(template.content);
      setMessageType(template.type as 'whatsapp' | 'email' | 'sms');
      setSelectedTemplate(templateId);
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim() || !messageContent.trim()) {
      toast({
        title: "Erro",
        description: "Nome do template e conteúdo são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    createTemplate({
      name: templateName,
      content: messageContent,
      type: messageType
    });

    setTemplateName('');
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem antes de enviar",
        variant: "destructive",
      });
      return;
    }

    if (filteredLeads.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum lead encontrado com os filtros selecionados",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Buscar configurações de webhook
      const webhookSettings = settings.find(s => s.key === 'webhook_urls');
      
      if (!webhookSettings?.value) {
        toast({
          title: "Erro",
          description: "Configurações de webhook não encontradas. Configure em Configurações > Webhooks",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const webhookUrls = typeof webhookSettings.value === 'string' 
        ? JSON.parse(webhookSettings.value) 
        : webhookSettings.value;

      const webhookUrl = webhookUrls[messageType];

      if (!webhookUrl) {
        toast({
          title: "Erro",
          description: `URL do webhook ${messageType} não configurada. Configure em Configurações > Webhooks`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log('Enviando mensagem:', {
        type: messageType,
        recipients: filteredLeads.length,
        webhookUrl
      });

      // Registrar mensagem no histórico
      const messageData = {
        type: messageType,
        filter_type: filterType,
        filter_value: filterType !== 'all' ? filterValue : null,
        recipients_count: filteredLeads.length,
        content: messageContent,
        status: 'sending'
      };

      const { data: messageRecord, error: historyError } = await (supabase as any)
        .from('message_history')
        .insert([messageData])
        .select()
        .single();

      if (historyError) {
        console.error('Erro ao salvar no histórico:', historyError);
      }

      // Preparar dados para webhook
      const webhookData = {
        type: messageType,
        content: messageContent,
        recipients: filteredLeads.map(lead => ({
          id: lead.id,
          name: lead.name,
          whatsapp: lead.whatsapp,
          email: lead.email
        })),
        filter_info: {
          type: filterType,
          value: filterValue,
          total_recipients: filteredLeads.length
        },
        message_id: messageRecord?.id
      };

      console.log('Enviando para webhook:', {
        webhook_url: webhookUrl,
        webhook_data: webhookData
      });

      // Chamar edge function para enviar webhook
      const { data: webhookResponse, error: webhookError } = await supabase.functions.invoke('send-webhook', {
        body: {
          webhook_url: webhookUrl,
          webhook_data: webhookData
        }
      });

      if (webhookError) {
        console.error('Erro no webhook:', webhookError);
        
        // Atualizar status para falhou
        if (messageRecord?.id) {
          await (supabase as any)
            .from('message_history')
            .update({ 
              status: 'failed',
              webhook_response: webhookError.message || 'Erro no webhook'
            })
            .eq('id', messageRecord.id);
        }

        toast({
          title: "Erro no envio",
          description: webhookError.message || "Erro ao chamar webhook. Verifique as configurações.",
          variant: "destructive",
        });
      } else {
        console.log('Webhook executado com sucesso:', webhookResponse);
        
        // Atualizar status para enviado
        if (messageRecord?.id) {
          await (supabase as any)
            .from('message_history')
            .update({ 
              status: 'sent',
              webhook_response: JSON.stringify(webhookResponse)
            })
            .eq('id', messageRecord.id);
        }

        toast({
          title: "Mensagem enviada",
          description: `Mensagem ${messageType} enviada para ${filteredLeads.length} lead(s)`,
        });

        setMessageContent('');
        setSelectedTemplate('');
      }

    } catch (error) {
      console.error('Erro geral ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem. Verifique as configurações e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPreviewRecipients = () => {
    return filteredLeads.slice(0, 5);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      sent: { color: 'bg-green-100 text-green-800', label: 'Enviado' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Falhou' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
      sending: { color: 'bg-blue-100 text-blue-800', label: 'Enviando' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'whatsapp': return <MessageSquare className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <Smartphone className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Central de Mensagens</h1>
          <p className="text-gray-600 mt-1">Gerencie e envie mensagens para seus leads</p>
        </div>
      </div>

      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Enviar Mensagem
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Message Composition */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Compor Mensagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Mensagem</Label>
                  <Select value={messageType} onValueChange={(value: 'whatsapp' | 'email' | 'sms') => setMessageType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          WhatsApp
                        </div>
                      </SelectItem>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          E-mail
                        </div>
                      </SelectItem>
                      <SelectItem value="sms">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          SMS
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um template (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates
                        .filter(template => template.type === messageType)
                        .map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mensagem</Label>
                  <Textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Digite sua mensagem aqui..."
                    className="min-h-[200px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSendMessage}
                    disabled={isLoading || !messageContent.trim()}
                    className="flex-1"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isLoading ? 'Enviando...' : 'Enviar Mensagem'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Filters and Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros e Destinatários
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Filtrar por</Label>
                  <Select value={filterType} onValueChange={(value: 'all' | 'course' | 'event') => setFilterType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Todos os leads
                        </div>
                      </SelectItem>
                      <SelectItem value="course">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Por curso
                        </div>
                      </SelectItem>
                      <SelectItem value="event">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Por evento
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filterType === 'course' && (
                  <div className="space-y-2">
                    <Label>Curso</Label>
                    <Select value={filterValue} onValueChange={setFilterValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um curso" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filterType === 'event' && (
                  <div className="space-y-2">
                    <Label>Evento</Label>
                    <Select value={filterValue} onValueChange={setFilterValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um evento" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4" />
                    <span className="font-medium">Destinatários: {filteredLeads.length}</span>
                  </div>
                  
                  {getPreviewRecipients().length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 mb-2">Primeiros {Math.min(5, filteredLeads.length)} destinatários:</p>
                      {getPreviewRecipients().map((lead, index) => (
                        <div key={lead.id} className="text-sm text-gray-700">
                          • {lead.name} - {messageType === 'email' ? lead.email : lead.whatsapp}
                        </div>
                      ))}
                      {filteredLeads.length > 5 && (
                        <p className="text-sm text-gray-500">... e mais {filteredLeads.length - 5} destinatários</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Criar Template
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do Template</Label>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Ex: Boas-vindas, Lembrete de curso..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={messageType} onValueChange={(value: 'whatsapp' | 'email' | 'sms') => setMessageType(value)}>
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
                  <Label>Conteúdo do Template</Label>
                  <Textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Digite o conteúdo do template..."
                    className="min-h-[150px]"
                  />
                </div>

                <Button onClick={handleSaveTemplate} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Templates Salvos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div key={template.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <div className="flex items-center gap-1">
                          {getTypeIcon(template.type)}
                          <span className="text-sm text-gray-500 capitalize">{template.type}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{template.content}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleTemplateSelect(template.id)}
                      >
                        Usar Template
                      </Button>
                    </div>
                  ))}
                  
                  {templates.length === 0 && (
                    <p className="text-gray-500 text-center py-8">Nenhum template criado ainda</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico de Mensagens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {messageHistory.map((message) => (
                  <div key={message.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(message.type)}
                        <span className="font-medium capitalize">{message.type}</span>
                        {getStatusBadge(message.status)}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(message.sent_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    
                    <div className="mb-2">
                      <span className="text-sm text-gray-600">
                        Enviado para {message.recipients_count} destinatário(s)
                      </span>
                      {message.filter_type && message.filter_type !== 'all' && (
                        <span className="text-sm text-gray-600 ml-2">
                          • Filtro: {message.filter_type}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm bg-gray-50 p-2 rounded truncate">
                      {message.content}
                    </p>
                  </div>
                ))}
                
                {messageHistory.length === 0 && (
                  <p className="text-gray-500 text-center py-8">Nenhuma mensagem enviada ainda</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Messages;
