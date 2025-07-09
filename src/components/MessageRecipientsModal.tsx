
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessageRecipients } from '@/hooks/useMessageRecipients';
import { CheckCircle, XCircle, Clock, Send, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface MessageRecipientsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageHistoryId: string;
  deliveryCode: string;
}

const MessageRecipientsModal: React.FC<MessageRecipientsModalProps> = ({
  open,
  onOpenChange,
  messageHistoryId,
  deliveryCode
}) => {
  const { data: recipients = [], isLoading } = useMessageRecipients(messageHistoryId);
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendente' },
      sent: { color: 'bg-blue-100 text-blue-800', icon: Send, label: 'Enviado' },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Entregue' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Falhou' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <Badge className={config.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const copyDeliveryCode = () => {
    navigator.clipboard.writeText(deliveryCode);
    toast({
      title: "Código copiado",
      description: "Código de entrega copiado para a área de transferência",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Destinatários da Mensagem
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Código:</span>
              <code className="bg-muted px-2 py-1 rounded text-sm">{deliveryCode}</code>
              <Button size="sm" variant="outline" onClick={copyDeliveryCode}>
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">Carregando destinatários...</div>
            ) : recipients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum destinatário encontrado
              </div>
            ) : (
              recipients.map((recipient: any) => (
                <div key={recipient.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{recipient.leads?.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {recipient.leads?.email} | {recipient.leads?.whatsapp}
                      </p>
                    </div>
                    {getStatusBadge(recipient.delivery_status)}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <div>Enviado: {new Date(recipient.sent_at).toLocaleString('pt-BR')}</div>
                    {recipient.delivered_at && (
                      <div>Entregue: {new Date(recipient.delivered_at).toLocaleString('pt-BR')}</div>
                    )}
                    {recipient.error_message && (
                      <div className="text-red-600 mt-1">Erro: {recipient.error_message}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MessageRecipientsModal;
