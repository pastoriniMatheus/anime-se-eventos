
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, User, Calendar } from 'lucide-react';

interface ExistingUserStepProps {
  existingLead: any;
  qrCodeData: any;
  onContinueToPayment: () => void;
  onBackToForm: () => void;
}

const ExistingUserStep = ({ 
  existingLead, 
  qrCodeData, 
  onContinueToPayment, 
  onBackToForm 
}: ExistingUserStepProps) => {
  const isPaid = existingLead?.status?.name?.toLowerCase() === 'pago';
  
  return (
    <div className="space-y-6">
      {/* Header com informações do usuário */}
      <div className="text-center">
        <div className="lead-form-qr-section p-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 bg-blue-500 rounded-full text-white">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Usuário já cadastrado</h3>
          </div>
          
          <div className="space-y-2 text-left">
            <p className="text-gray-700">
              <strong>Nome:</strong> {existingLead.name}
            </p>
            {existingLead.email && (
              <p className="text-gray-700">
                <strong>E-mail:</strong> {existingLead.email}
              </p>
            )}
            {existingLead.whatsapp && (
              <p className="text-gray-700">
                <strong>WhatsApp:</strong> {existingLead.whatsapp}
              </p>
            )}
            {qrCodeData?.event?.name && (
              <div className="flex items-center gap-2 text-gray-700 mt-3">
                <Calendar className="w-4 h-4" />
                <span><strong>Evento:</strong> {qrCodeData.event.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status do pagamento */}
      <div className="text-center">
        {isPaid ? (
          <div className="lead-form-payment-card p-8 border-green-200 bg-green-50">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-green-500 rounded-full text-white">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-800">Pagamento Confirmado!</h3>
                <p className="text-green-600 mt-1">Seu cadastro está completo e ativo</p>
              </div>
            </div>
            
            <div className="space-y-3 text-left bg-white p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Status: Pagamento confirmado</span>
              </div>
              {existingLead.course && (
                <p className="text-gray-700">
                  <strong>Curso:</strong> {existingLead.course.name}
                </p>
              )}
              {existingLead.postgraduate_course && (
                <p className="text-gray-700">
                  <strong>Pós-graduação:</strong> {existingLead.postgraduate_course.name}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="lead-form-payment-card p-8 border-yellow-200 bg-yellow-50">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-yellow-500 rounded-full text-white">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-yellow-800">Pendente Confirmação de Pagamento</h3>
                <p className="text-yellow-600 mt-1">Complete seu pagamento para ativar o cadastro</p>
              </div>
            </div>
            
            <div className="space-y-3 text-left bg-white p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-700">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Status: Aguardando confirmação de pagamento</span>
              </div>
              {existingLead.course && (
                <p className="text-gray-700">
                  <strong>Curso:</strong> {existingLead.course.name}
                </p>
              )}
              {existingLead.postgraduate_course && (
                <p className="text-gray-700">
                  <strong>Pós-graduação:</strong> {existingLead.postgraduate_course.name}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6">
        <Button
          onClick={onBackToForm}
          variant="outline"
          className="flex-1"
        >
          Voltar ao Formulário
        </Button>
        
        {!isPaid && (
          <Button
            onClick={onContinueToPayment}
            className="flex-1 lead-form-step-button"
          >
            Avançar para Pagamento
          </Button>
        )}
      </div>
    </div>
  );
};

export default ExistingUserStep;
