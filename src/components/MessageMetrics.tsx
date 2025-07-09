
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMessageMetrics } from '@/hooks/useMessageRecipients';
import { 
  MessageSquare, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Send,
  TrendingUp
} from 'lucide-react';

const MessageMetrics = () => {
  const { data: metrics, isLoading } = useMessageMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricsData = [
    {
      title: "Total de Envios",
      value: metrics?.totalMessages || 0,
      icon: MessageSquare,
      color: "text-blue-600"
    },
    {
      title: "Total de Destinatários",
      value: metrics?.totalRecipients || 0,
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Taxa de Entrega",
      value: `${metrics?.deliveryRate || 0}%`,
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Entregas Confirmadas",
      value: metrics?.delivered || 0,
      icon: CheckCircle,
      color: "text-green-600"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsData.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                  </div>
                  <IconComponent className={`h-8 w-8 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Status breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status dos Envios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Pendente: {metrics?.pending || 0}
            </Badge>
            <Badge variant="default" className="flex items-center gap-1">
              <Send className="w-3 h-3" />
              Enviado: {metrics?.sent || 0}
            </Badge>
            <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Entregue: {metrics?.delivered || 0}
            </Badge>
            <Badge variant="destructive" className="flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Falhou: {metrics?.failed || 0}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessageMetrics;
