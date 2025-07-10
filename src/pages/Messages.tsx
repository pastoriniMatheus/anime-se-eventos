import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Send, History, Users, MessageSquare, Loader2, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMessages } from '@/hooks/useMessages';
import { useCourses } from '@/hooks/useCourses';
import { useEvents } from '@/hooks/useEvents';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import MessageRecipientsModal from '@/components/MessageRecipientsModal';
import EmojiPicker from '@/components/EmojiPicker';

interface LeadStatus {
  id: string;
  name: string;
  color: string;
}

const Messages = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [filterType, setFilterType] = useState<'course' | 'event' | 'status' | 'all' | ''>('');
  const [filterValue, setFilterValue] = useState('');
  const [sendOnlyToNew, setSendOnlyToNew] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedMessageHistory, setSelectedMessageHistory] = useState<any>(null);
  
  const { data: messages = [], isLoading: messagesLoading } = useMessages();
  const { data: courses = [] } = useCourses();
  const { data: events = [] } = useEvents();
  const { data: systemSettings = [] } = useSystemSettings();

  // Buscar status de leads
  const { data: leadStatuses = [] } = useQuery({
    queryKey: ['lead-statuses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_statuses')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as LeadStatus[];
    }
  });

  // Buscar contatos que nunca receberam mensagem - corrigindo a query
  const { data: contactsNeverMessaged = [] } = useQuery({
    queryKey: ['contacts-never-messaged'],
    queryFn: async () => {
      // Primeiro buscar todos os leads que já receberam mensagem
      const { data: recipientLeadIds, error: recipientsError } = await supabase
        .from('message_recipients')
        .select('lead_id');
      
      if (recipientsError) throw recipientsError;
      
      const excludeIds = recipientLeadIds?.map(r => r.lead_id) || [];
      
      // Buscar leads que não estão na lista de destinatários
      let query = supabase
        .from('leads')
        .select(`
          id, name, email, whatsapp,
          courses(name),
          events(name),
          lead_statuses(name, color)
        `);
      
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.map(id => `'${id}'`).join(',')})`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      message: string;
      filterType?: string;
      filterValue?: string;
      sendOnlyToNew: boolean;
    }) => {
      console.log('Enviando mensagem com parâmetros:', data);
      
      const { error } = await supabase.functions.invoke('send-webhook', {
        body: {
          type: 'whatsapp',
          message: data.message,
          filter_type: data.filterType || null,
          filter_value: data.filterValue || null,
          send_only_to_new: data.sendOnlyToNew
        }
      });

      if (error) {
        console.error('Erro ao enviar mensagem:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso!",
      });
      setMessage('');
      setFilterType('');
      setFilterValue('');
      setSendOnlyToNew(false);
      queryClient.invalidateQueries({ queryKey: ['message_history'] });
      queryClient.invalidateQueries({ queryKey: ['contacts-never-messaged'] });
    },
    onError: (error: any) => {
      console.error('Erro completo:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message || "Ocorreu um erro ao enviar a mensagem",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Digite uma mensagem antes de enviar",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      await sendMessageMutation.mutateAsync({
        message: message.trim(),
        filterType: filterType === 'all' ? undefined : filterType || undefined,
        filterValue: filterValue || undefined,
        sendOnlyToNew
      });
    } finally {
      setIsSending(false);
    }
  };

  const getWebhookUrl = () => {
    const webhookSettings = systemSettings.find(s => s.key === 'webhook_urls');
    if (webhookSettings?.value) {
      try {
        const urls = JSON.parse(webhookSettings.value);
        return urls.whatsapp || 'Não configurado';
      } catch {
        return 'Configuração inválida';
      }
    }
    return 'Não configurado';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'sending':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const addEmojiToMessage = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
    setSendOnlyToNew(checked === true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-600">Mensagens</h1>
        </div>

        <Tabs defaultValue="send" className="space-y-6">
          <TabsList>
            <TabsTrigger value="send" className="flex items-center space-x-2">
              <Send className="h-4 w-4" />
              <span>Enviar Mensagem</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>Histórico</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Contatos Não Contatados ({contactsNeverMessaged.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Nova Mensagem WhatsApp</span>
                </CardTitle>
                <CardDescription>
                  Envie mensagens para seus leads via WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem</Label>
                  <div className="relative">
                    <Textarea
                      id="message"
                      placeholder="Digite sua mensagem aqui..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="pr-12"
                    />
                    <div className="absolute bottom-2 right-2">
                      <EmojiPicker onEmojiSelect={addEmojiToMessage} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="filter-type">Filtrar por</Label>
                    <Select value={filterType} onValueChange={(value: any) => {
                      setFilterType(value);
                      setFilterValue('');
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o filtro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os contatos</SelectItem>
                        <SelectItem value="course">Curso</SelectItem>
                        <SelectItem value="event">Evento</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filterType && filterType !== '' && filterType !== 'all' && (
                    <div className="space-y-2">
                      <Label htmlFor="filter-value">
                        {filterType === 'course' && 'Curso'}
                        {filterType === 'event' && 'Evento'}
                        {filterType === 'status' && 'Status'}
                      </Label>
                      <Select value={filterValue} onValueChange={setFilterValue}>
                        <SelectTrigger>
                          <SelectValue placeholder={`Selecione o ${filterType}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {filterType === 'course' && courses.map((course: any) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.name}
                            </SelectItem>
                          ))}
                          {filterType === 'event' && events.map((event: any) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.name}
                            </SelectItem>
                          ))}
                          {filterType === 'status' && leadStatuses.map((status) => (
                            <SelectItem key={status.id} value={status.id}>
                              {status.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send-only-new"
                    checked={sendOnlyToNew}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <Label htmlFor="send-only-new">
                    Enviar apenas para contatos que ainda não receberam mensagem
                  </Label>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Webhook Configurado:</h4>
                  <p className="text-sm text-blue-700 font-mono">{getWebhookUrl()}</p>
                </div>

                <Button 
                  onClick={handleSendMessage}
                  disabled={isSending || !message.trim()}
                  className="w-full"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Mensagem
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Mensagens</CardTitle>
                <CardDescription>
                  Visualize todas as mensagens enviadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Carregando histórico...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma mensagem enviada ainda
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg: any) => (
                      <div key={msg.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(msg.status)}
                            <Badge variant={msg.status === 'sent' ? 'default' : msg.status === 'failed' ? 'destructive' : 'secondary'}>
                              {msg.status === 'sent' ? 'Enviado' : 
                               msg.status === 'failed' ? 'Falhou' : 
                               msg.status === 'sending' ? 'Enviando' : 'Pendente'}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {msg.recipients_count} destinatários
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              {new Date(msg.sent_at).toLocaleString('pt-BR')}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedMessageHistory(msg)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm">
                          <p className="font-medium">Mensagem:</p>
                          <p className="text-gray-700 mt-1">{msg.content}</p>
                        </div>
                        {msg.filter_type && (
                          <div className="text-xs text-gray-500">
                            Filtro: {msg.filter_type} - {msg.filter_value}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <CardTitle>Contatos Não Contatados</CardTitle>
                <CardDescription>
                  Lista de contatos que ainda não receberam nenhuma mensagem
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contactsNeverMessaged.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Todos os contatos já receberam pelo menos uma mensagem
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contactsNeverMessaged.map((contact: any) => (
                      <div key={contact.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{contact.name}</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              {contact.email && <p>Email: {contact.email}</p>}
                              {contact.whatsapp && <p>WhatsApp: {contact.whatsapp}</p>}
                              {contact.courses && <p>Curso: {contact.courses.name}</p>}
                              {contact.events && <p>Evento: {contact.events.name}</p>}
                            </div>
                          </div>
                          {contact.lead_statuses && (
                            <Badge 
                              style={{ backgroundColor: contact.lead_statuses.color + '20', color: contact.lead_statuses.color }}
                            >
                              {contact.lead_statuses.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {selectedMessageHistory && (
          <MessageRecipientsModal
            isOpen={true}
            onClose={() => setSelectedMessageHistory(null)}
            messageHistory={selectedMessageHistory}
          />
        )}
      </div>
    </Layout>
  );
};

export default Messages;
