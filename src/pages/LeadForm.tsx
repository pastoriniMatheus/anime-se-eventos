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
import { useWhatsAppValidation } from '@/hooks/useWhatsAppValidation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, Mail, BookOpen, Calendar, Clock, GraduationCap } from 'lucide-react';
import ThankYouScreen from '@/components/ThankYouScreen';

const LeadForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    email: '',
    courseId: '',
    eventId: '',
    shift: '',
    courseType: 'course'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<any>(null);
  const [scanSessionId, setScanSessionId] = useState<string | null>(null);

  const { data: courses = [] } = useCourses();
  const { data: postgraduateCourses = [] } = usePostgraduateCourses();
  const { data: events = [] } = useEvents();
  const { data: settingsArray = [] } = useFormSettings();
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
    const searchParams = new URLSearchParams(location.search);
    const trackingId = searchParams.get('t');

    if (trackingId) {
      const fetchQRCodeData = async () => {
        try {
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

            // Incrementar contador e criar scan session sem o campo scans
            const { error: updateError } = await supabase
              .from('qr_codes')
              .update({ 
                // Remover tentativa de incrementar o campo scans que não existe
              })
              .eq('id', qrCode.id);

            if (updateError) {
              console.error('Erro ao atualizar QR code:', updateError);
            }

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
        shift: formData.shift || null,
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

      setShowThankYou(true);
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

  if (showThankYou) {
    return (
      <ThankYouScreen 
        title={settings.thank_you_title || "Obrigado!"}
        message={settings.thank_you_message || "Seus dados foram enviados com sucesso. Entraremos em contato em breve!"}
        redirectUrl={settings.redirect_url}
        onBackToForm={() => setShowThankYou(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <User className="w-6 h-6" />
            {settings.title || 'Cadastro de Lead'}
          </CardTitle>
          {settings.subtitle && (
            <p className="text-blue-100 mt-2">{settings.subtitle}</p>
          )}
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
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome completo *
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Digite seu nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-gray-700 font-medium flex items-center gap-2">
                <Phone className="w-4 h-4" />
                WhatsApp *
              </Label>
              <Input
                id="whatsapp"
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
              <Label htmlFor="email" className="text-gray-700 font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                E-mail *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-3">
              <Label className="text-gray-700 font-medium flex items-center gap-2">
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
                  <Label htmlFor="course">Graduação</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="postgraduate" id="postgraduate" />
                  <Label htmlFor="postgraduate">Pós-graduação</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {formData.courseType === 'course' ? 'Curso de Graduação' : 'Curso de Pós-graduação'}
              </Label>
              <Select value={formData.courseId} onValueChange={(value) => handleChange('courseId', value)}>
                <SelectTrigger className="w-full border-gray-300 focus:border-blue-500">
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
                <Label className="text-gray-700 font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Evento
                </Label>
                <Select value={formData.eventId} onValueChange={(value) => handleChange('eventId', value)}>
                  <SelectTrigger className="w-full border-gray-300 focus:border-blue-500">
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

            {formData.courseType === 'course' && (
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Turno de Preferência
                </Label>
                <Select value={formData.shift} onValueChange={(value) => handleChange('shift', value)}>
                  <SelectTrigger className="w-full border-gray-300 focus:border-blue-500">
                    <SelectValue placeholder="Selecione um turno (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manhã">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                    <SelectItem value="noite">Noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
              disabled={isLoading || isValidating}
            >
              {isLoading ? 'Enviando...' : 'Enviar Cadastro'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadForm;
