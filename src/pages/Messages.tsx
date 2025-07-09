import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLeads } from '@/hooks/useLeads';
import { useCourses } from '@/hooks/useCourses';
import { useEvents } from '@/hooks/useEvents';
import { useMessageTemplates, useMessageHistory, useCreateMessageTemplate } from '@/hooks/useMessages';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useClearMessageHistory } from '@/hooks/useMessageRecipients';
import { useQuery } from '@tanstack/react-query';
import MessageMetrics from '@/components/MessageMetrics';
import MessageRecipientsModal from '@/components/MessageRecipientsModal';
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
  Save,
  Tag,
  Trash2,
  AlertTriangle,
  Copy
} from 'lucide-react';

const Messages = () => {
  const [messageContent, setMessageContent] = useState('');
  const [messageType, setMessageType] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [filterType, setFilterType] = useState<'all' | 'course' | 'event' | 'status'>('all');
  const [filterValue, setFilterValue] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [onlyUnsent, setOnlyUnsent] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string>('');
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const [selectedDeliveryCode, setSelectedDeliveryCode] = useState('');

  const { data: leads = [] } = useLeads();
  const { data: courses = [] } = useCourses();
  const { data: events = [] } = useEvents();
  const { data: templates = [] } = useMessageTemplates();
  const { data: messageHistory = [] } = useMessageHistory();
  const { mutate: createTemplate } = useCreateMessageTemplate();
  const { data: settings = [] } = useSystemSettings();
  const { mutate: clearHistory, isPending: isClearingHistory } = useClearMessageHistory();
  const { toast } = useToast();

  // Buscar status de leads
  const { data: leadStatuses = [] } = useQuery({
    queryKey: ['lead_statuses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_statuses')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

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

  // Buscar leads que já receberam mensagens do tipo selecionado
  const { data: sentMessageRecipients = [] } = useQuery({
    queryKey: ['sent_message_recipients', messageType],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('message_recipients')
        .select(`
          lead_id,
          message_history!inner(type)
        `)
        .eq('message_history.type', messageType)
        .eq('delivery_status', 'delivered');
      
      if (error) throw error;
      return data?.map((item: any) => item.lead_id) || [];
    }
  });

  const getFilteredLeads = () => {
    let filtered = leads;

    if (filterType === 'course' && filterValue) {
      filtered = leads.filter(lead => lead.course_id === filterValue);
    } else if (filterType === 'event' && filterValue) {
      filtered = leads.filter(lead => lead.event_id === filterValue);
    } else if (filterType === 'status' && filterValue) {
      filtered = leads.filter(lead => lead.status_id === filterValue);
    }

    // Filtrar apenas leads que não receberam mensagem se checkbox estiver marcado
    if (onlyUnsent) {
      filtered = filtered.filter(lead => !sentMessageRecipients.includes(lead.id));
    }

    return filtered;
  };

  const filteredLeads = getFilteredLeads();

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
      console.log('🔄 Iniciando processo de envio de mensagem...');
      
      // Buscar configurações de webhook
      const webhookSettings = settings.find(s => s.key === 'webhook_urls');
      console.log('📋 Configurações encontradas:', webhookSettings);
      
      if (!webhookSettings?.value) {
        console.error('❌ Configurações de webhook não encontradas');
        toast({
          title: "Erro de Configuração",
          description: "Configurações de webhook não encontradas. Configure em Configurações > Webhooks",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      let webhookUrls;
      try {
        webhookUrls = typeof webhookSettings.value === 'string' 
          ? JSON.parse(webhookSettings.value) 
          : webhookSettings.value;
        console.log('🔗 URLs de webhook parseadas:', webhookUrls);
      } catch (parseError) {
        console.error('❌ Erro ao parsear URLs de webhook:', parseError);
        toast({
          title: "Erro de Configuração",
          description: "Erro ao processar configurações de webhook. Verifique as configurações.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Pegar a URL EXATA do campo salvo
      const webhookUrl = webhookUrls[messageType];
      console.log(`🎯 URL EXATA do webhook ${messageType}:`, webhookUrl);
      console.log('🔍 Tipo de dados da URL:', typeof webhookUrl);

      if (!webhookUrl || webhookUrl.trim() === '') {
        console.error(`❌ URL do webhook ${messageType} não configurada ou vazia`);
        toast({
          title: "Erro de Configuração",
          description: `URL do webhook ${messageType} não configurada. Configure em Configurações > Webhooks`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Validar se a URL é válida
      try {
        const testUrl = new URL(webhookUrl);
        console.log('✅ URL validada:', testUrl.toString());
      } catch (urlError) {
        console.error('❌ URL inválida:', webhookUrl, urlError);
        toast({
          title: "Erro de Configuração",
          description: `URL do webhook ${messageType} é inválida: ${webhookUrl}`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log('📊 Iniciando envio:', {
        type: messageType,
        recipients: filteredLeads.length,
        webhookUrl: webhookUrl
      });
      
      // Registrar mensagem no histórico primeiro
      const messageData = {
        type: messageType,
        filter_type: filterType,
        filter_value: filterType !== 'all' ? filterValue : null,
        recipients_count: filteredLeads.length,
        content: messageContent,
        status: 'sending'
      };

      console.log('💾 Salvando no histórico:', messageData);

      const { data: messageRecord, error: historyError } = await (supabase as any)
        .from('message_history')
        .insert([messageData])
        .select()
        .single();

      if (historyError) {
        console.error('❌ Erro ao salvar no histórico:', historyError);
        throw historyError;
      }

      // Registrar destinatários individuais
      const recipients = filteredLeads.map(lead => ({
        message_history_id: messageRecord.id,
        lead_id: lead.id,
        delivery_status: 'pending'
      }));

      const { error: recipientsError } = await (supabase as any)
        .from('message_recipients')
        .insert(recipients);

      if (recipientsError) {
        console.error('❌ Erro ao salvar destinatários:', recipientsError);
      }

      // Buscar configurações de webhook
      const webhookSettings = settings.find(s => s.key === 'webhook_urls');
      
      if (!webhookSettings?.value) {
        throw new Error('Configurações de webhook não encontradas');
      }

      let webhookUrls;
      try {
        webhookUrls = typeof webhookSettings.value === 'string' 
          ? JSON.parse(webhookSettings.value) 
          : webhookSettings.value;
      } catch (parseError) {
        throw new Error('Erro ao processar configurações de webhook');
      }

      const webhookUrl = webhookUrls[messageType];
      if (!webhookUrl || webhookUrl.trim() === '') {
        throw new Error(`URL do webhook ${messageType} não configurada`);
      }

      // Preparar dados para webhook
      const webhookData = {
        type: messageType,
        content: messageContent,
        delivery_code: messageRecord.delivery_code,
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
        message_id: messageRecord.id
      };

      console.log('📤 Enviando webhook...');

      // Chamar edge function para enviar webhook
      const { data: webhookResponse, error: webhookError } = await supabase.functions.invoke('send-webhook', {
        body: {
          webhook_url: webhookUrl,
          webhook_data: webhookData
        }
      });

      if (webhookError) {
        console.error('❌ Erro na edge function:', webhookError);
        
        // Atualizar status para falhou
        await (supabase as any)
          .from('message_history')
          .update({ 
            status: 'failed',
            webhook_response: JSON.stringify(webhookError)
          })
          .eq('id', messageRecord.id);

        throw new Error(`Erro ao enviar webhook: ${webhookError.message}`);
      } else {
        console.log('✅ Webhook executado com sucesso');
        
        // Atualizar status para enviado
        await (supabase as any)
          .from('message_history')
          .update({ 
            status: 'sent',
            webhook_response: JSON.stringify(webhookResponse)
          })
          .eq('id', messageRecord.id);

        // Atualizar status dos destinatários para 'sent'
        await (supabase as any)
          .from('message_recipients')
          .update({ delivery_status: 'sent' })
          .eq('message_history_id', messageRecord.id);

        toast({
          title: "Mensagem enviada com sucesso! 🎉",
          description: `Mensagem ${messageType} enviada para ${filteredLeads.length} lead(s). Código: ${messageRecord.delivery_code}`,
        });

        // Limpar formulário
        setMessageContent('');
        setSelectedTemplate('');
        setOnlyUnsent(false);
      }

    } catch (error: any) {
      console.error('💥 Erro geral ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message || "Erro interno ao processar a mensagem",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Tem certeza que deseja limpar todo o histórico de mensagens? Esta ação não pode ser desfeita.')) {
      clearHistory();
    }
  };

  const copyDeliveryCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado",
      description: "Código de entrega copiado para a área de transferência",
    });
  };

  const showRecipients = (messageId: string, deliveryCode: string) => {
    setSelectedMessageId(messageId);
    setSelectedDeliveryCode(deliveryCode);
    setShowRecipientsModal(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Central de Mensagens</h1>
          <p className="text-gray-600 mt-1">Gerencie e envie mensagens para seus leads</p>
        </div>
        <MessageMetrics />
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
                  <Select value={filterType} onValueChange={(value: 'all' | 'course' | 'event' | 'status') => setFilterType(value)}>
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
                      <SelectItem value="status">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          Por status
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

                {filterType === 'status' && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={filterValue} onValueChange={setFilterValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um status" />
                      </SelectTrigger>
                      <SelectContent>
                        {leadStatuses.map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                            {status.name}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="only-unsent" 
                    checked={onlyUnsent}
                    onCheckedChange={(checked) => setOnlyUnsent(checked as boolean)}
                  />
                  <Label htmlFor="only-unsent" className="text-sm">
                    Enviar apenas para contatos que ainda não receberam mensagem {messageType}
                  </Label>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4" />
                    <span className="font-medium">
                      Destinatários: {filteredLeads.length}
                      {onlyUnsent && sentMessageRecipients.length > 0 && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({leads.length - sentMessageRecipients.length} não receberam ainda)
                        </span>
                      )}
                    </span>
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
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Histórico de Mensagens
                </CardTitle>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearHistory}
                  disabled={isClearingHistory}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {isClearingHistory ? 'Limpando...' : 'Limpar Histórico'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {messageHistory.map((message: any) => (
                  <div key={message.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(message.type)}
                        <span className="font-medium capitalize">{message.type}</span>
                        {getStatusBadge(message.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {new Date(message.sent_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Enviado para {message.recipients_count} destinatário(s)
                        {message.filter_type && message.filter_type !== 'all' && (
                          <span className="ml-2">• Filtro: {message.filter_type}</span>
                        )}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {message.delivery_code && (
                          <>
                            <code className="bg-muted px-2 py-1 rounded text-xs">
                              {message.delivery_code}
                            </code>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyDeliveryCode(message.delivery_code)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => showRecipients(message.id, message.delivery_code)}
                        >
                          <Users className="w-3 h-3 mr-1" />
                          Ver Destinatários
                        </Button>
                      </div>
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

      <MessageRecipientsModal
        open={showRecipientsModal}
        onOpenChange={setShowRecipientsModal}
        messageHistoryId={selectedMessageId}
        deliveryCode={selectedDeliveryCode}
      />
    </div>
  );
};

export default Messages;
