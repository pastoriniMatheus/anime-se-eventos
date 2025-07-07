import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCourses } from '@/hooks/useCourses';
import { usePostgraduateCourses } from '@/hooks/usePostgraduateCourses';
import { useEvents } from '@/hooks/useEvents';
import { useFormSettings } from '@/hooks/useFormSettings';
import { useNomenclature } from '@/hooks/useNomenclature';
import { useWhatsAppValidation } from '@/hooks/useWhatsAppValidation';
import { useLeadSubmission } from '@/hooks/useLeadSubmission';
import { useCheckExistingLead } from '@/hooks/useLeads';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Calendar, Sparkles } from 'lucide-react';
import PersonalInfoStep from '@/components/forms/PersonalInfoStep';
import AcademicInterestStep from '@/components/forms/AcademicInterestStep';
import PaymentStep from '@/components/forms/PaymentStep';
import ReceiptUploadStep from '@/components/forms/ReceiptUploadStep';
import ExistingUserStep from '@/components/forms/ExistingUserStep';
import FormProgress from '@/components/forms/FormProgress';
import ThankYouScreen from '@/components/ThankYouScreen';

const LeadForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showExistingUser, setShowExistingUser] = useState(false);
  const [existingLead, setExistingLead] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    email: '',
    courseId: '',
    eventId: '',
    courseType: 'course'
  });
  const [leadId, setLeadId] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<any>(null);
  const [scanSessionId, setScanSessionId] = useState<string | null>(null);

  const { data: courses = [] } = useCourses();
  const { data: postgraduateCourses = [] } = usePostgraduateCourses();
  const { data: events = [] } = useEvents();
  const { data: settingsArray = [] } = useFormSettings();
  const { courseNomenclature, postgraduateNomenclature } = useNomenclature();
  const { validateWhatsApp, isValidating, validationResult, setValidationResult } = useWhatsAppValidation();
  const { submitLead, isLoading } = useLeadSubmission();
  const { mutateAsync: checkExistingLead, isPending: isCheckingExisting } = useCheckExistingLead();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Convert settings array to object for easy access
  const settings = React.useMemo(() => {
    const settingsObj: Record<string, any> = {};
    settingsArray.forEach(setting => {
      const key = setting.key.replace('form_', '');
      settingsObj[key] = setting.value;
    });
    return settingsObj;
  }, [settingsArray]);

  // Check if payment is enabled
  const paymentEnabled = settings.payment_value && settings.pix_key;
  const totalSteps = paymentEnabled ? 4 : 2;
  const stepTitles = paymentEnabled 
    ? ["Dados Pessoais", "Interesse Acadêmico", "Pagamento", "Comprovante"]
    : ["Dados Pessoais", "Interesse Acadêmico"];

  // Apply dynamic styles with enhanced color system
  useEffect(() => {
    const primaryColor = settings.primary_color || '#e91e63';
    const secondaryColor = settings.secondary_color || '#9c27b0';
    const accentColor = settings.accent_color || '#ff1493';
    const buttonColor = settings.button_color || '#e91e63';
    const backgroundColor = settings.background_color || '#ffffff';
    const textColor = settings.text_color || '#1f2937';
    const fieldBgColor = settings.field_background_color || '#f9fafb';
    const fieldBorderColor = settings.field_border_color || '#e91e63';
    const cardBgColor = settings.card_background_color || '#ffffff';
    const headerGradientStart = settings.header_gradient_start || '#e91e63';
    const headerGradientEnd = settings.header_gradient_end || '#9c27b0';

    const style = document.createElement('style');
    style.id = 'dynamic-form-styles';
    
    const css = `
      .lead-form-container {
        background: linear-gradient(135deg, ${backgroundColor}, ${primaryColor}15) !important;
        min-height: 100vh;
      }
      
      .lead-form-card {
        background: ${cardBgColor} !important;
        color: ${textColor} !important;
        border: 2px solid ${primaryColor}20 !important;
        box-shadow: 0 25px 50px -12px ${primaryColor}25 !important;
        backdrop-filter: blur(10px) !important;
      }
      
      .lead-form-header {
        background: linear-gradient(135deg, ${headerGradientStart}, ${headerGradientEnd}) !important;
        position: relative;
        overflow: hidden;
      }
      
      .lead-form-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, transparent 30%, ${accentColor}20 50%, transparent 70%);
        animation: shimmer 3s ease-in-out infinite;
      }
      
      @keyframes shimmer {
        0%, 100% { transform: translateX(-100%); }
        50% { transform: translateX(100%); }
      }
      
      .lead-form-input {
        background: ${fieldBgColor} !important;
        border: 2px solid ${fieldBorderColor}40 !important;
        color: ${textColor} !important;
        border-radius: 12px !important;
        transition: all 0.3s ease !important;
      }
      
      .lead-form-input:focus {
        border-color: ${primaryColor} !important;
        box-shadow: 0 0 0 3px ${primaryColor}20 !important;
        transform: translateY(-1px) !important;
      }
      
      .lead-form-button {
        background: linear-gradient(135deg, ${buttonColor}, ${secondaryColor}) !important;
        border: none !important;
        border-radius: 12px !important;
        transition: all 0.3s ease !important;
        position: relative;
        overflow: hidden;
      }
      
      .lead-form-button:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 10px 25px -5px ${buttonColor}40 !important;
      }
      
      .lead-form-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
      }
      
      .lead-form-button:hover::before {
        left: 100%;
      }
      
      .lead-form-step-button {
        background: linear-gradient(135deg, ${primaryColor}, ${accentColor}) !important;
        border: none !important;
        border-radius: 12px !important;
        transition: all 0.3s ease !important;
      }
      
      .lead-form-step-button:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 20px -5px ${primaryColor}50 !important;
      }
      
      .lead-form-label {
        color: ${textColor} !important;
        font-weight: 500 !important;
      }
      
      .lead-form-progress-active {
        background: ${accentColor} !important;
        box-shadow: 0 0 15px ${accentColor}60 !important;
      }
      
      .lead-form-progress-completed {
        background: ${primaryColor} !important;
      }
      
      .lead-form-progress-line-active {
        background: ${primaryColor} !important;
      }
      
      .lead-form-select {
        border: 2px solid ${fieldBorderColor}40 !important;
        border-radius: 12px !important;
        background: ${fieldBgColor} !important;
      }
      
      .lead-form-select:focus {
        border-color: ${primaryColor} !important;
        box-shadow: 0 0 0 3px ${primaryColor}20 !important;
      }
      
      .lead-form-radio {
        accent-color: ${primaryColor} !important;
      }
      
      .lead-form-payment-card {
        border: 2px solid ${primaryColor}30 !important;
        background: linear-gradient(135deg, ${fieldBgColor}, ${primaryColor}05) !important;
        border-radius: 16px !important;
      }
      
      .lead-form-qr-section {
        background: linear-gradient(135deg, ${accentColor}10, ${primaryColor}10) !important;
        border: 2px solid ${primaryColor}20 !important;
        border-radius: 16px !important;
      }
      
      .lead-form-upload-area {
        border: 2px dashed ${primaryColor}50 !important;
        background: linear-gradient(135deg, ${fieldBgColor}, ${primaryColor}05) !important;
        border-radius: 12px !important;
        transition: all 0.3s ease !important;
      }
      
      .lead-form-upload-area:hover {
        border-color: ${primaryColor} !important;
        background: ${primaryColor}10 !important;
      }
    `;
    
    style.textContent = css;
    document.head.appendChild(style);
    
    return () => {
      const existingStyle = document.getElementById('dynamic-form-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [settings]);

  // Handle QR code tracking
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const trackingId = searchParams.get('t') || searchParams.get('tracking');

    if (trackingId) {
      const fetchQRCodeData = async () => {
        try {
          console.log('[LeadForm] Buscando dados do QR code:', trackingId);
          
          // Incrementar contador de scan primeiro
          const { error: incrementError } = await supabase.rpc('increment_qr_scan', {
            tracking_id: trackingId
          });

          if (incrementError) {
            console.error('[LeadForm] Erro ao incrementar scan:', incrementError);
          } else {
            console.log('[LeadForm] Scan incrementado com sucesso');
          }

          // Buscar dados do QR code
          const { data: qrCode, error } = await supabase
            .from('qr_codes')
            .select('*, event:events(id, name, whatsapp_number)')
            .eq('tracking_id', trackingId)
            .single();

          if (error) {
            console.error('[LeadForm] Erro ao buscar QR code:', error);
            return;
          }

          if (qrCode) {
            console.log('[LeadForm] QR code encontrado:', qrCode);
            setQrCodeData(qrCode);
            
            // Definir automaticamente o evento no formData
            setFormData(prev => ({
              ...prev,
              eventId: qrCode.event?.id || ''
            }));

            // Criar sessão de scan
            const { data: scanSession, error: sessionError } = await supabase
              .from('scan_sessions')
              .insert({
                qr_code_id: qrCode.id,
                event_id: qrCode.event?.id || qrCode.event_id,
                scanned_at: new Date().toISOString(),
                user_agent: navigator.userAgent,
                ip_address: 'web-access'
              })
              .select()
              .single();

            if (sessionError) {
              console.error('[LeadForm] Erro ao criar sessão de scan:', sessionError);
            } else if (scanSession) {
              console.log('[LeadForm] Sessão de scan criada:', scanSession.id);
              setScanSessionId(scanSession.id);
            }
          }
        } catch (error) {
          console.error('[LeadForm] Erro na busca do QR code:', error);
        }
      };

      fetchQRCodeData();
    }
  }, [location.search]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'whatsapp' && validationResult) {
      setValidationResult(null);
    }
  };

  const validateCurrentStep = async () => {
    console.log(`[LeadForm] Validando etapa ${currentStep}`);
    
    if (currentStep === 1) {
      if (!formData.name || !formData.whatsapp || !formData.email) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        return false;
      }

      // Validação do WhatsApp se habilitada
      const whatsappValidationEnabled = settingsArray.find(s => s.key === 'whatsapp_validation_enabled')?.value === 'true';
      
      if (whatsappValidationEnabled && validationResult !== 'valid') {
        const isValid = await validateWhatsApp(formData.whatsapp);
        if (!isValid) return false;
      }

      // Verificar se o lead já existe
      try {
        console.log('[LeadForm] Verificando lead existente...');
        const existingLeadData = await checkExistingLead({
          name: formData.name,
          whatsapp: formData.whatsapp,
          email: formData.email
        });

        if (existingLeadData) {
          console.log('[LeadForm] Lead existente encontrado:', existingLeadData);
          setExistingLead(existingLeadData);
          setLeadId(existingLeadData.id);
          setShowExistingUser(true);
          return false; // Para não avançar para próxima etapa
        }
      } catch (error) {
        console.error('[LeadForm] Erro ao verificar lead existente:', error);
        // Continue normalmente se houver erro na verificação
      }
    }

    if (currentStep === 2) {
      if (!formData.courseId || !formData.courseType) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, selecione um curso.",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const nextStep = async () => {
    console.log(`[LeadForm] Avançando da etapa ${currentStep}`);
    
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    // Se chegou ao final das etapas obrigatórias (etapa 2)
    if (currentStep === 2) {
      if (!paymentEnabled) {
        // Se não tem pagamento, cria o lead e mostra tela de agradecimento
        try {
          console.log('[LeadForm] Criando lead (sem pagamento)');
          const newLeadId = await submitLead(formData, scanSessionId, qrCodeData);
          setLeadId(newLeadId);
          setShowThankYou(true);
          return;
        } catch (error) {
          console.error('[LeadForm] Erro ao criar lead:', error);
          return;
        }
      } else {
        // Se tem pagamento, cria o lead e avança para a etapa de pagamento
        try {
          console.log('[LeadForm] Criando lead (com pagamento)');
          const newLeadId = await submitLead(formData, scanSessionId, qrCodeData);
          setLeadId(newLeadId);
        } catch (error) {
          console.error('[LeadForm] Erro ao criar lead:', error);
          return;
        }
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleUploadComplete = () => {
    toast({
      title: "Cadastro finalizado!",
      description: "Seu cadastro foi concluído com sucesso!",
    });
    setShowThankYou(true);
  };

  const handleBackToForm = () => {
    if (settings.redirect_url) {
      window.location.href = settings.redirect_url;
    } else {
      navigate('/');
    }
  };

  const handleContinueToPayment = () => {
    setShowExistingUser(false);
    setCurrentStep(3); // Vai direto para etapa de pagamento
  };

  const handleBackFromExisting = () => {
    setShowExistingUser(false);
    setExistingLead(null);
    setLeadId(null);
    setCurrentStep(1);
  };

  // Se deve mostrar tela de agradecimento
  if (showThankYou) {
    return (
      <ThankYouScreen
        title={settings.thank_you_title || "Obrigado!"}
        message={settings.thank_you_message || "Seus dados foram enviados com sucesso. Entraremos em contato em breve!"}
        logoUrl={settings.banner_image_url}
        redirectUrl={settings.redirect_url}
        onBackToForm={handleBackToForm}
      />
    );
  }

  return (
    <div className="min-h-screen lead-form-container flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl lead-form-card">
        {settings.banner_image_url && (
          <div className="w-full h-48 overflow-hidden rounded-t-lg relative">
            <img 
              src={settings.banner_image_url} 
              alt="Banner do formulário" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        )}
        
        <CardHeader className="text-center lead-form-header text-white rounded-t-lg relative z-10">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            {settings.title || 'Cadastro de Lead'}
          </CardTitle>
          {settings.subtitle && (
            <p className="text-white/90 mt-2 font-medium">{settings.subtitle}</p>
          )}
          
          {!showExistingUser && (
            <FormProgress 
              currentStep={currentStep} 
              totalSteps={totalSteps} 
              stepTitles={stepTitles} 
            />
          )}
        </CardHeader>
        
        <CardContent className="p-8">
          {qrCodeData?.event?.name && !showExistingUser && (
            <div className="mb-6 p-4 lead-form-qr-section">
              <div className="flex items-center gap-2 font-medium">
                <Calendar className="w-4 h-4" />
                <span>Evento: {qrCodeData.event.name}</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {showExistingUser ? (
              <ExistingUserStep
                existingLead={existingLead}
                qrCodeData={qrCodeData}
                onContinueToPayment={handleContinueToPayment}
                onBackToForm={handleBackFromExisting}
              />
            ) : (
              <>
                {currentStep === 1 && (
                  <PersonalInfoStep
                    formData={formData}
                    onFormDataChange={handleChange}
                    validationResult={validationResult}
                    isValidating={isValidating}
                  />
                )}

                {currentStep === 2 && (
                  <AcademicInterestStep
                    formData={formData}
                    onFormDataChange={handleChange}
                    courses={courses}
                    postgraduateCourses={postgraduateCourses}
                    events={events}
                    courseNomenclature={courseNomenclature}
                    postgraduateNomenclature={postgraduateNomenclature}
                    qrCodeData={qrCodeData}
                  />
                )}

                {currentStep === 3 && paymentEnabled && (
                  <PaymentStep
                    paymentValue={settings.payment_value || "R$ 200,00"}
                    pixKey={settings.pix_key || "pagamento@instituicao.com.br"}
                    qrCodeUrl={settings.payment_qr_code_url}
                  />
                )}

                {currentStep === 4 && paymentEnabled && leadId && (
                  <ReceiptUploadStep
                    leadId={leadId}
                    onUploadComplete={handleUploadComplete}
                  />
                )}
              </>
            )}
          </div>

          {!showExistingUser && (
            <div className="flex justify-between pt-6">
              {currentStep > 1 && (
                <Button 
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="px-6 border-2 hover:bg-gray-50"
                >
                  Voltar
                </Button>
              )}
              
              <div className="ml-auto">
                {currentStep < totalSteps ? (
                  <Button 
                    type="button"
                    onClick={nextStep}
                    className="px-8 lead-form-step-button hover:opacity-90 font-semibold"
                    disabled={isLoading || isValidating || isCheckingExisting}
                  >
                    {isLoading || isCheckingExisting ? 'Verificando...' : (currentStep === 2 && !paymentEnabled ? 'Finalizar Cadastro' : 'Próximo')}
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadForm;
