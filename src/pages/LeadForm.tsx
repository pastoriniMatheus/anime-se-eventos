
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Calendar } from 'lucide-react';
import PersonalInfoStep from '@/components/forms/PersonalInfoStep';
import AcademicInterestStep from '@/components/forms/AcademicInterestStep';
import FormProgress from '@/components/forms/FormProgress';
import PaymentScreen from '@/components/PaymentScreen';

const LeadForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    email: '',
    courseId: '',
    eventId: '',
    courseType: 'course'
  });
  const [showPayment, setShowPayment] = useState(false);
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

  // Apply dynamic styles
  useEffect(() => {
    if (settings.primary_color || settings.secondary_color || settings.button_color || 
        settings.background_color || settings.text_color || settings.field_background_color || 
        settings.field_border_color) {
      
      const style = document.createElement('style');
      style.id = 'dynamic-form-styles';
      
      const css = `
        .lead-form-container {
          background: ${settings.background_color || '#ffffff'} !important;
          color: ${settings.text_color || '#1f2937'} !important;
        }
        .lead-form-card {
          background: ${settings.background_color || '#ffffff'} !important;
          color: ${settings.text_color || '#1f2937'} !important;
        }
        .lead-form-header {
          background: linear-gradient(135deg, ${settings.primary_color || '#3b82f6'}, ${settings.secondary_color || '#f59e0b'}) !important;
        }
        .lead-form-input {
          background: ${settings.field_background_color || '#f9fafb'} !important;
          border-color: ${settings.field_border_color || '#d1d5db'} !important;
          color: ${settings.text_color || '#1f2937'} !important;
        }
        .lead-form-button {
          background: linear-gradient(135deg, ${settings.button_color || '#10b981'}, ${settings.primary_color || '#3b82f6'}) !important;
        }
        .lead-form-step-button {
          background: ${settings.primary_color || '#3b82f6'} !important;
        }
        .lead-form-label {
          color: ${settings.text_color || '#1f2937'} !important;
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
    }
  }, [settings]);

  // Handle QR code tracking
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const trackingId = searchParams.get('t') || searchParams.get('tracking');

    if (trackingId) {
      const fetchQRCodeData = async () => {
        try {
          console.log('Buscando dados do QR code:', trackingId);
          
          const { data: qrCode, error } = await supabase
            .from('qr_codes')
            .select('*, event:events(name, whatsapp_number)')
            .eq('tracking_id', trackingId)
            .single();

          if (error) {
            console.error('Erro ao buscar QR code:', error);
            return;
          }

          if (qrCode) {
            console.log('QR code encontrado:', qrCode);
            setQrCodeData(qrCode);
            setFormData(prev => ({
              ...prev,
              eventId: qrCode.event_id || ''
            }));
          }
        } catch (error) {
          console.error('Erro na busca do QR code:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.whatsapp || !formData.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validação do WhatsApp se habilitada
    const whatsappValidationEnabled = settingsArray.find(s => s.key === 'whatsapp_validation_enabled')?.value === 'true';
    
    if (whatsappValidationEnabled && validationResult !== 'valid') {
      const isValid = await validateWhatsApp(formData.whatsapp);
      if (!isValid) return;
    }

    try {
      const newLeadId = await submitLead(formData, scanSessionId, qrCodeData);
      
      // Verificar se deve mostrar tela de pagamento
      const paymentEnabled = settings.payment_value && settings.pix_key;
      if (paymentEnabled) {
        setLeadId(newLeadId);
        setShowPayment(true);
      } else {
        // Redirecionar para página de sucesso ou inicial
        navigate('/');
      }
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && (!formData.name || !formData.whatsapp || !formData.email)) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios antes de continuar.",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 2));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handlePaymentComplete = () => {
    navigate('/');
  };

  const handleBackToForm = () => {
    setShowPayment(false);
    setCurrentStep(1);
    setFormData({
      name: '',
      whatsapp: '',
      email: '',
      courseId: '',
      eventId: qrCodeData?.event_id || '',
      courseType: 'course'
    });
    setLeadId(null);
  };

  if (showPayment && leadId) {
    return (
      <PaymentScreen 
        leadId={leadId}
        onComplete={handlePaymentComplete}
        onBackToForm={handleBackToForm}
        paymentValue={settings.payment_value || "R$ 200,00"}
        pixKey={settings.pix_key || "pagamento@instituicao.com.br"}
        qrCodeUrl={settings.payment_qr_code_url}
      />
    );
  }

  const stepTitles = ["Dados Pessoais", "Interesse Acadêmico"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 lead-form-container">
      <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/90 backdrop-blur-sm lead-form-card">
        {settings.banner_image_url && (
          <div className="w-full h-48 overflow-hidden rounded-t-lg">
            <img 
              src={settings.banner_image_url} 
              alt="Banner do formulário" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <CardHeader className="text-center lead-form-header text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <User className="w-6 h-6" />
            {settings.title || 'Cadastro de Lead'}
          </CardTitle>
          {settings.subtitle && (
            <p className="text-blue-100 mt-2">{settings.subtitle}</p>
          )}
          
          <FormProgress 
            currentStep={currentStep} 
            totalSteps={2} 
            stepTitles={stepTitles} 
          />
        </CardHeader>
        
        <CardContent className="p-8">
          {qrCodeData && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-800">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Evento: {qrCodeData.event?.name}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="flex justify-between pt-6">
              {currentStep > 1 && (
                <Button 
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="px-6"
                >
                  Voltar
                </Button>
              )}
              
              <div className="ml-auto">
                {currentStep < 2 ? (
                  <Button 
                    type="button"
                    onClick={nextStep}
                    className="px-6 lead-form-step-button hover:opacity-90"
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="px-6 lead-form-button hover:opacity-90 text-white font-semibold transition-all duration-200 transform hover:scale-105"
                    disabled={isLoading || isValidating}
                  >
                    {isLoading ? 'Enviando...' : 'Finalizar Cadastro'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadForm;
