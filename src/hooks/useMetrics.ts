
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useScanSessions = () => {
  return useQuery({
    queryKey: ['scan_sessions'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_scan_sessions');
        
        if (error) {
          console.error('Error fetching scan sessions:', error);
          return [];
        }
        
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

        // Buscar dados de QR codes
        const { data: qrCodes, error: qrError } = await supabase
          .from('qr_codes')
          .select('*');
        
        if (qrError) throw qrError;

        // Buscar sessões de scan usando a função RPC
        const { data: sessions, error: sessionsError } = await supabase.rpc('get_scan_sessions');
        
        if (sessionsError) {
          console.error('Error fetching scan sessions:', sessionsError);
        }

        const sessionsData = sessions || [];
        const totalScans = sessionsData.length;
        const totalLeads = leads?.length || 0;
        const convertedSessions = sessionsData.filter((s: any) => s?.lead_id).length;
        const totalQRScans = qrCodes?.reduce((sum, qr) => sum + (qr.scans || 0), 0) || 0;

        return {
          totalScans,
          totalLeads,
          totalQRScans,
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
