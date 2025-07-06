
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useScanSessions = () => {
  return useQuery({
    queryKey: ['scan_sessions'],
    queryFn: async () => {
      try {
        // Usar a função RPC para buscar sessões com dados relacionados
        const { data, error } = await (supabase as any).rpc('get_scan_sessions');
        
        if (error) {
          console.error('Error fetching scan sessions:', error);
          return [];
        }
        
        console.log('Sessões de scan encontradas:', data?.length || 0);
        return data || [];
      } catch (error) {
        console.error('Error fetching scan sessions:', error);
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
        // Buscar dados de leads
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('*');
        
        if (leadsError) throw leadsError;

        // Buscar todas as sessões de scan
        const { data: sessions, error: sessionsError } = await supabase
          .from('scan_sessions')
          .select('*');
        
        if (sessionsError) throw sessionsError;

        // Buscar dados de QR codes com contadores de scan atualizados
        const { data: qrCodes, error: qrError } = await supabase
          .from('qr_codes')
          .select('id, scans, type');
        
        if (qrError) throw qrError;

        const sessionsData = sessions || [];
        const qrCodesData = qrCodes || [];
        
        // Calcular total de scans a partir dos QR codes (agora com a coluna correta)
        const totalScansFromQR = qrCodesData.reduce((sum, qr) => sum + (qr.scans || 0), 0);
        
        // Usar o maior valor entre sessões registradas e contador dos QR codes
        const totalScans = Math.max(sessionsData.length, totalScansFromQR);
        
        const totalLeads = leads?.length || 0;
        const convertedSessions = sessionsData.filter((s: any) => s?.lead_id).length;
        const totalQRCodes = qrCodesData.length;

        console.log('Métricas calculadas:', {
          totalScans,
          totalScansFromQR,
          sessionsCount: sessionsData.length,
          totalLeads,
          totalQRCodes,
          convertedSessions
        });

        return {
          totalScans,
          totalLeads,
          totalQRScans: totalQRCodes,
          convertedSessions,
          conversionRate: totalScans > 0 ? (convertedSessions / totalScans) * 100 : 0,
          leadsPerScan: totalScans > 0 ? (totalLeads / totalScans) * 100 : 0,
          sessionTrackingRate: totalLeads > 0 ? (convertedSessions / totalLeads) * 100 : 0
        };
      } catch (error) {
        console.error('Error calculating conversion metrics:', error);
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
