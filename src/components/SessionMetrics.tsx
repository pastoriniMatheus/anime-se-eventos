
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Users, Target, TrendingUp } from 'lucide-react';
import { useScanSessions, useConversionMetrics } from '@/hooks/useMetrics';

const SessionMetrics = () => {
  const { data: sessions = [], isLoading: sessionsLoading } = useScanSessions();
  const { data: metrics, isLoading: metricsLoading } = useConversionMetrics();

  console.log('SessionMetrics - Sessions:', sessions);
  console.log('SessionMetrics - Metrics:', metrics);

  if (sessionsLoading || metricsLoading || !metrics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse bg-muted h-4 rounded w-3/4 mb-2"></div>
              <div className="animate-pulse bg-muted h-8 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas de Sessão */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Scans</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalScans}</div>
            <p className="text-xs text-muted-foreground">
              Sessões registradas: {sessions.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversões</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.convertedSessions}</div>
            <p className="text-xs text-muted-foreground">
              Scans que viraram leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Scan → Lead
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              Leads capturados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Sessões Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Sessões de Scan Recentes</CardTitle>
          <CardDescription>
            Últimas sessões de scan e suas conversões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>QR Code</TableHead>
                <TableHead>Scans</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.slice(0, 10).map((session: any) => (
                <TableRow key={session.id}>
                  <TableCell>
                    {new Date(session.scanned_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>{session.event?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {session.qr_code?.short_url || 'N/A'}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {session.qr_code?.scans || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={session.lead_id ? "default" : "secondary"}>
                      {session.lead_id ? "Convertido" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {session.lead ? (
                      <div className="text-sm">
                        <div className="font-medium">{session.lead.name}</div>
                        <div className="text-muted-foreground">{session.lead.email}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {session.ip_address || 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {sessions.length === 0 && (
            <div className="text-center py-8">
              <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhuma sessão de scan registrada ainda.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionMetrics;
