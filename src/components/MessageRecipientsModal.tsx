
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, Clock, Copy } from 'lucide-react';
import { useMessageRecipients } from '@/hooks/useMessageRecipients';
import { useToast } from '@/hooks/use-toast';

interface MessageRecipientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageHistory: any;
}

const MessageRecipientsModal: React.FC<MessageRecipientsModalProps> = ({
  isOpen,
  onClose,
  messageHistory
}) => {
  const { toast } = useToast();
  const { data: recipients, isLoading } = useMessageRecipients(messageHistory?.id);

  const copyDeliveryCode = () => {
    if (messageHistory?.delivery_code) {
      navigator.clipboard.writeText(messageHistory.delivery_code);
      toast({
        title: "Código copiado",
        description: "Código de entrega copiado para a área de transferência",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Entregue</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Falhou</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Destinatários da Mensagem</DialogTitle>
          <DialogDescription>
            Detalhes dos destinatários para a mensagem enviada em{' '}
            {messageHistory?.sent_at ? 
              new Date(messageHistory.sent_at).toLocaleString('pt-BR') : 
              'Data não disponível'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {messageHistory?.delivery_code && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Código de Entrega:</span>
              <code className="bg-white px-2 py-1 rounded text-sm">
                {messageHistory.delivery_code}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyDeliveryCode}
                className="ml-auto"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}

          <ScrollArea className="h-96">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : recipients && recipients.length > 0 ? (
              <div className="space-y-2">
                {recipients.map((recipient: any) => (
                  <div
                    key={recipient.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(recipient.delivery_status)}
                      <div>
                        <p className="font-medium">{recipient.leads?.name}</p>
                        <p className="text-sm text-gray-600">
                          {recipient.leads?.email} • {recipient.leads?.whatsapp}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(recipient.delivery_status)}
                      {recipient.delivered_at && (
                        <span className="text-xs text-gray-500">
                          {new Date(recipient.delivered_at).toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Nenhum destinatário encontrado
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageRecipientsModal;
