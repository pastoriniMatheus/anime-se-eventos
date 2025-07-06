
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useFormSettings = () => {
  return useQuery({
    queryKey: ['form_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .in('key', [
          'form_thank_you_message', 
          'form_thank_you_title', 
          'form_redirect_url', 
          'form_title', 
          'form_subtitle',
          'form_banner_image_url',
          'form_primary_color',
          'form_secondary_color',
          'form_accent_color',
          'form_button_color',
          'form_background_color',
          'form_text_color',
          'form_field_background_color',
          'form_field_border_color',
          'form_card_background_color',
          'form_header_gradient_start',
          'form_header_gradient_end',
          'form_payment_value',
          'form_pix_key',
          'form_payment_qr_code_url',
          'whatsapp_validation_enabled'
        ]);
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useUpdateFormSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      console.log('Salvando configuração do formulário:', key, value);
      
      // First check if it exists
      const { data: existing } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', key)
        .single();

      let result;
      
      if (existing) {
        // Update
        result = await supabase
          .from('system_settings')
          .update({ 
            value: typeof value === 'string' ? value : JSON.stringify(value),
            updated_at: new Date().toISOString()
          })
          .eq('key', key)
          .select()
          .single();
      } else {
        // Insert
        result = await supabase
          .from('system_settings')
          .insert({ 
            key, 
            value: typeof value === 'string' ? value : JSON.stringify(value)
          })
          .select()
          .single();
      }

      if (result.error) {
        console.error('Erro ao salvar:', result.error);
        throw result.error;
      }

      return result.data;
    },
    onSuccess: (data) => {
      console.log('Configuração do formulário salva com sucesso:', data);
      queryClient.invalidateQueries({ queryKey: ['form_settings'] });
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
    },
    onError: (error) => {
      console.error('Erro na mutation do formulário:', error);
    }
  });
};
