
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useWhatsAppValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'valid' | 'invalid' | null>(null);
  const { toast } = useToast();

  const validateWhatsApp = async (phone: string): Promise<boolean> => {
    const numbers = phone.replace(/\D/g, '');
    
    if (numbers.length !== 11) {
      setValidationResult('invalid');
      toast({
        title: "Formato inválido",
        description: "O número deve ter 11 dígitos (DD + 9 dígitos)",
        variant: "destructive",
      });
      return false;
    }

    setIsValidating(true);
    
    try {
      console.log('🔄 Iniciando validação WhatsApp para:', numbers);

      // Buscar webhook de validação nas configurações  
      const { data: settings, error: settingsError } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'webhook_urls')
        .single();

      if (settingsError || !settings?.value) {
        console.log('❌ Webhook não configurado:', settingsError);
        toast({
          title: "Configuração necessária",
          description: "Configure o webhook de validação WhatsApp nas configurações do sistema para usar esta funcionalidade.",
          variant: "destructive",
        });
        setIsValidating(false);
        setValidationResult('valid'); // Permitir prosseguir sem validação se não configurado
        return true;
      }

      const webhookUrls = typeof settings.value === 'object' ? settings.value as any : JSON.parse(settings.value as string);
      const webhookUrl = webhookUrls?.whatsappValidation;
      
      if (!webhookUrl) {
        console.log('❌ Webhook de validação não configurado');
        toast({
          title: "Configuração necessária",
          description: "Configure o webhook de validação WhatsApp nas configurações do sistema para usar esta funcionalidade.",
          variant: "destructive",
        });
        setIsValidating(false);
        setValidationResult('valid'); // Permitir prosseguir sem validação se não configurado
        return true;
      }

      console.log('✅ Webhook encontrado:', webhookUrl);

      // Gerar ID único para a validação
      const validationId = crypto.randomUUID();
      console.log('🆔 ID de validação gerado:', validationId);

      // Verificar se já existe uma validação com este ID (improvável mas possível)
      const { data: existingValidation } = await (supabase as any)
        .from('whatsapp_validations')
        .select('*')
        .eq('id', validationId)
        .maybeSingle();

      if (existingValidation) {
        console.log('⚠️ ID de validação já existe, gerando novo...');
        return validateWhatsApp(phone); // Tentar novamente com novo ID
      }

      // Chamar a edge function de validação
      console.log('📡 Chamando edge function validate-whatsapp...');
      const { data, error } = await supabase.functions.invoke('validate-whatsapp', {
        body: {
          whatsapp: numbers,
          validation_id: validationId
        }
      });

      if (error) {
        console.error('❌ Erro na edge function:', error);
        throw new Error(error.message || 'Erro na função de validação');
      }

      console.log('✅ Edge function retornou:', data);

      // Aguardar resposta da validação com timeout estendido
      const pollValidation = async (): Promise<boolean> => {
        let attempts = 0;
        const maxAttempts = 45; // Aumentado para 45 segundos
        
        console.log('🔍 Iniciando polling para validação ID:', validationId);
        console.log('⏱️ Timeout configurado para:', maxAttempts, 'segundos');
        
        while (attempts < maxAttempts) {
          console.log(`📊 Tentativa ${attempts + 1}/${maxAttempts} - Aguardando resposta...`);
          
          const { data: validation, error: queryError } = await (supabase as any)
            .from('whatsapp_validations')
            .select('*')
            .eq('id', validationId)
            .maybeSingle();

          if (queryError) {
            console.error('❌ Erro na consulta:', queryError);
          } else if (validation) {
            console.log('📋 Validação encontrada:', {
              id: validation.id,
              status: validation.status,
              created_at: validation.created_at,
              validated_at: validation.validated_at,
              response_message: validation.response_message
            });
            
            if (validation.status !== 'pending') {
              console.log('🎯 Validação finalizada com status:', validation.status);
              
              if (validation.status === 'valid') {
                setValidationResult('valid');
                setIsValidating(false);
                console.log('✅ Número validado com sucesso!');
                toast({
                  title: "WhatsApp validado",
                  description: "Número verificado com sucesso!",
                  variant: "default",
                });
                return true;
              } else if (validation.status === 'invalid') {
                setValidationResult('invalid');
                setIsValidating(false);
                console.log('❌ Número inválido:', validation.response_message);
                toast({
                  title: "WhatsApp não encontrado",
                  description: validation.response_message || "Por favor, verifique e digite novamente seu número do WhatsApp. Certifique-se de que o número está correto e ativo.",
                  variant: "destructive",
                });
                return false;
              } else if (validation.status === 'error') {
                setValidationResult('invalid');
                setIsValidating(false);
                console.log('💥 Erro na validação:', validation.response_message);
                toast({
                  title: "Erro na validação",
                  description: validation.response_message || "Ocorreu um erro ao validar o número. Tente novamente.",
                  variant: "destructive",
                });
                return false;
              }
            } else {
              console.log('⏳ Validação ainda pendente, aguardando...');
            }
          } else {
            console.log('⚠️ Nenhuma validação encontrada ainda...');
          }

          // Aguardar 1 segundo antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }

        // Timeout - verificar uma última vez se houve atraso
        console.log('⏰ Timeout atingido - verificando uma última vez...');
        const { data: finalValidation } = await (supabase as any)
          .from('whatsapp_validations')
          .select('*')
          .eq('id', validationId)
          .maybeSingle();

        if (finalValidation && finalValidation.status !== 'pending') {
          console.log('🔄 Validação encontrada após timeout:', finalValidation.status);
          
          if (finalValidation.status === 'valid') {
            setValidationResult('valid');
            setIsValidating(false);
            return true;
          } else {
            setValidationResult('invalid');
            setIsValidating(false);
            return false;
          }
        }

        // Realmente timeout - permitir prosseguir com aviso
        console.log('⏰ Timeout definitivo na validação - permitindo prosseguir');
        toast({
          title: "Timeout na validação",
          description: "Não foi possível validar o número em tempo hábil. O webhook pode estar lento ou indisponível. Você pode prosseguir, mas recomendamos verificar as configurações.",
          variant: "default",
        });
        setValidationResult('valid');
        setIsValidating(false);
        return true;
      };

      return await pollValidation();

    } catch (error: any) {
      console.error('💥 Erro na validação:', error);
      setIsValidating(false);
      
      // Em caso de erro, permitir prosseguir mas avisar o usuário
      let errorMessage = "Erro na validação, mas você pode prosseguir";
      let errorTitle = "Aviso";
      
      if (error.message?.includes('Webhook')) {
        errorMessage = "Serviço de validação indisponível. Você pode prosseguir.";
        errorTitle = "Serviço indisponível";
      } else if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
        errorMessage = "A validação está demorando mais que o esperado. Verifique sua conexão e as configurações do webhook.";
        errorTitle = "Timeout na validação";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "default",
      });
      
      setValidationResult('valid'); // Permitir prosseguir em caso de erro
      return true;
    }
  };

  return {
    validateWhatsApp,
    isValidating,
    validationResult,
    setValidationResult
  };
};
