import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCourses } from '@/hooks/useCourses';
import { usePostgraduateCourses } from '@/hooks/usePostgraduateCourses';
import { useEvents } from '@/hooks/useEvents';
import { useFormSettings } from '@/hooks/useFormSettings';
import { useNomenclature } from '@/hooks/useNomenclature';
import { useWhatsAppValidation } from '@/hooks/useWhatsAppValidation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, Mail, BookOpen, Calendar, GraduationCap } from 'lucide-react';
import ThankYouScreen from '@/components/ThankYouScreen';
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
  const [isLoading, setIsLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
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
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Convert settings array to object for easy access
  const settings = React.useMemo(() => {
    const settingsObj: Record<string, any> = {};
    settingsArray.forEach(setting => {
      const key = setting.key.replace('form_', ''); // Remove 'form_' prefix for easier access
      settingsObj[key] = setting.value;
    });
    return settingsObj;
  }, [settingsArray]);

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

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const trackingId = searchParams.get('t') || searchParams.get('tracking');

    if (trackingId) {
      const fetchQRCodeData = async () => {
        try {
          // Increment scan count
          await supabase.rpc('increment_qr_scan', { tracking_id: trackingId });
          
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
            setQrCodeData(qrCode);
            setFormData(prev => ({
              ...prev,
              eventId: qrCode.event_id || ''
            }));

            // Criar scan session
            const { data: session, error: sessionError } = await supabase
              .from('scan_sessions')
              .insert({
                qr_code_id: qrCode.id,
                event_id: qrCode.event_id,
                user_agent: navigator.userAgent,
                ip_address: ''
              })
              .select()
              .single();

            if (sessionError) {
              console.error('Erro ao criar scan session:', sessionError);
            } else if (session) {
              setScanSessionId(session.id);
            }
          }
        } catch (error) {
          console.error('Erro na busca do QR code:', error);
        }
      };

      fetchQRCodeData();
    }
  }, [location.search]);

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

    // Check if WhatsApp validation is enabled
    const whatsappValidationEnabled = settingsArray.find(s => s.key === 'whatsapp_validation_enabled')?.value === 'true';
    
    if (whatsappValidationEnabled && validationResult !== 'valid') {
      const isValid = await validateWhatsApp(formData.whatsapp);
      if (!isValid) return;
    }

    setIsLoading(true);

    try {
      const leadData = {
        name: formData.name,
        whatsapp: formData.whatsapp,
        email: formData.email,
        event_id: formData.eventId || null,
        course_id: formData.courseType === 'course' ? formData.courseId || null : null,
        postgraduate_course_id: formData.courseType === 'postgraduate' ? formData.courseId || null : null,
        course_type: formData.courseType,
        scan_session_id: scanSessionId,
        source: qrCodeData ? 'qr_code' : 'form'
      };

      const { data: lead, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;

      if (scanSessionId && lead) {
        await supabase
          .from('scan_sessions')
          .update({
            converted: true,
            converted_at: new Date().toISOString(),
            lead_id: lead.id
          })
          .eq('id', scanSessionId);
      }

      // Store lead ID and show payment screen
      setLeadId(lead.id);
      setShowPayment(true);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar formulário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'whatsapp' && validationResult) {
      setValidationResult(null);
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
    setShowPayment(false);
    setShowThankYou(true);
  };

  const handleBackToForm = () => {
    setShowPayment(false);
    setShowThankYou(false);
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

  if (showThankYou) {
    return (
      <ThankYouScreen 
        title={settings.thank_you_title || "Cadastro Finalizado!"}
        message={settings.thank_you_message || "Obrigado! Seu cadastro foi finalizado com sucesso. Entraremos em contato em breve!"}
        redirectUrl={settings.redirect_url}
        onBackToForm={handleBackToForm}
      />
    );
  }

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

  const stepTitles = [
    "Dados Pessoais",
    "Interesse Acadêmico"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 lead-form-container">
      <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/90 backdrop-blur-sm lead-form-card">
        {/* Banner/Capa do formulário */}
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
          
          {/* Progress Steps */}
          <div className="flex justify-center mt-4 space-x-4">
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep ? 'bg-white text-blue-600' : 'bg-blue-400 text-white'
                }`}>
                  {step}
                </div>
                {step < 2 && <div className={`w-8 h-0.5 ml-2 ${step < currentStep ? 'bg-white' : 'bg-blue-400'}`} />}
              </div>
            ))}
          </div>
          <p className="text-sm text-blue-100 mt-2">{stepTitles[currentStep - 1]}</p>
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
            {/* Etapa 1: Dados Pessoais */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 font-medium flex items-center gap-2 lead-form-label">
                    <User className="w-4 h-4" />
                    Nome completo *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 lead-form-input"
                    placeholder="Digite seu nome completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-gray-700 font-medium flex items-center gap-2 lead-form-label">
                    <Phone className="w-4 h-4" />
                    WhatsApp *
                  </Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => handleChange('whatsapp', e.target.value)}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 lead-form-input"
                    placeholder="(11) 99999-9999"
                    required
                  />
                  {isValidating && (
                    <p className="text-sm text-blue-600">Validando número...</p>
                  )}
                  {validationResult === 'valid' && (
                    <p className="text-sm text-green-600">✓ Número validado</p>
                  )}
                  {validationResult === 'invalid' && (
                    <p className="text-sm text-red-600">✗ Número inválido</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium flex items-center gap-2 lead-form-label">
                    <Mail className="w-4 h-4" />
                    E-mail *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 lead-form-input"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>
            )}

            {/* Etapa 2: Interesse Acadêmico */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-gray-700 font-medium flex items-center gap-2 lead-form-label">
                    <GraduationCap className="w-4 h-4" />
                    Tipo de Curso
                  </Label>
                  <RadioGroup
                    value={formData.courseType}
                    onValueChange={(value) => handleChange('courseType', value)}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="course" id="course" />
                      <Label htmlFor="course" className="lead-form-label">{courseNomenclature}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="postgraduate" id="postgraduate" />
                      <Label htmlFor="postgraduate" className="lead-form-label">{postgraduateNomenclature}</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium flex items-center gap-2 lead-form-label">
                    <BookOpen className="w-4 h-4" />
                    {formData.courseType === 'course' ? courseNomenclature : postgraduateNomenclature}
                  </Label>
                  <Select value={formData.courseId} onValueChange={(value) => handleChange('courseId', value)}>
                    <SelectTrigger className="w-full border-gray-300 focus:border-blue-500 lead-form-input">
                      <SelectValue placeholder="Selecione um curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {(formData.courseType === 'course' ? courses : postgraduateCourses).map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!qrCodeData && (
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium flex items-center gap-2 lead-form-label">
                      <Calendar className="w-4 h-4" />
                      Evento
                    </Label>
                    <Select value={formData.eventId} onValueChange={(value) => handleChange('eventId', value)}>
                      <SelectTrigger className="w-full border-gray-300 focus:border-blue-500 lead-form-input">
                        <SelectValue placeholder="Selecione um evento (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
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
                    {isLoading ? 'Enviando...' : 'Continuar para Pagamento'}
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
