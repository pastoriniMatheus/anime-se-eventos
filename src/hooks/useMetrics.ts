
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useScanSessions = () => {
  return useQuery({
    queryKey: ['scan_sessions'],
    queryFn: async () => {
      try {
        console.log('Buscando sessões de scan...');
        
        // Usar a função RPC corrigida para buscar sessões com dados relacionados
        const { data, error } = await supabase.rpc('get_scan_sessions');
        
        if (error) {
          console.error('Erro ao buscar sessões:', error);
          return [];
        }
        
        console.log('Sessões encontradas:', data?.length || 0);
        console.log('Dados das sessões:', data);
        return data || [];
      } catch (error) {
        console.error('Erro ao buscar sessões:', error);
        return [];
      }
    }
  });
};

export const useConversionMetrics = () => {
  return useQuery({
    queryKey: ['conversion_metrics'],
    queryFn: async () => {
      try {
        console.log('Calculando métricas de conversão...');
        
        // Buscar leads
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('*');
        
        if (leadsError) {
          console.error('Erro ao buscar leads:', leadsError);
          throw leadsError;
        }

        // Buscar QR codes com contadores
        const { data: qrCodes, error: qrError } = await supabase
          .from('qr_codes')
          .select('id, scans, type');
        
        if (qrError) {
          console.error('Erro ao buscar QR codes:', qrError);
          throw qrError;
        }

        // Buscar sessões de scan
        const { data: sessions, error: sessionsError } = await supabase
          .from('scan_sessions')
          .select('*');
        
        if (sessionsError) {
          console.error('Erro ao buscar sessões:', sessionsError);
          throw sessionsError;
        }

        const leadsData = leads || [];
        const qrCodesData = qrCodes || [];
        const sessionsData = sessions || [];
        
        // Calcular total de scans: somar os contadores dos QR codes
        const totalScansFromQR = qrCodesData.reduce((sum, qr) => sum + (qr.scans || 0), 0);
        
        // Total de sessões registradas
        const totalSessions = sessionsData.length;
        
        // Usar o maior valor entre scans dos QR codes e sessões registradas
        const totalScans = Math.max(totalScansFromQR, totalSessions);
        
        const totalLeads = leadsData.length;
        const convertedSessions = sessionsData.filter((s: any) => s?.lead_id).length;
        const totalQRCodes = qrCodesData.length;

        const metrics = {
          totalScans,
          totalLeads,
          totalQRScans: totalQRCodes,
          convertedSessions,
          conversionRate: totalScans > 0 ? (convertedSessions / totalScans) * 100 : 0,
          leadsPerScan: totalScans > 0 ? (totalLeads / totalScans) * 100 : 0,
          sessionTrackingRate: totalLeads > 0 ? (convertedSessions / totalLeads) * 100 : 0
        };

        console.log('Métricas calculadas:', {
          totalScansFromQR,
          totalSessions,
          totalScans: metrics.totalScans,
          totalLeads: metrics.totalLeads,
          convertedSessions: metrics.convertedSessions,
          conversionRate: metrics.conversionRate
        });

        return metrics;
      } catch (error) {
        console.error('Erro ao calcular métricas:', error);
        return {
          totalScans: 0,
          totalLeads: 0,
          totalQRScans: 0,
          convertedSessions: 0,
          conversionRate: 0,
          leadsPerScan: 0,
          sessionTrackingRate: 0
        };
      }
    }
  });
};
