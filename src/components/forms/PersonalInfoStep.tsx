
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Phone, Mail } from 'lucide-react';

interface PersonalInfoStepProps {
  formData: {
    name: string;
    whatsapp: string;
    email: string;
  };
  onFormDataChange: (field: string, value: string) => void;
  validationResult: string | null;
  isValidating: boolean;
}

const PersonalInfoStep = ({ 
  formData, 
  onFormDataChange, 
  validationResult, 
  isValidating 
}: PersonalInfoStepProps) => {
  return (
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
          onChange={(e) => onFormDataChange('name', e.target.value)}
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
          onChange={(e) => onFormDataChange('whatsapp', e.target.value)}
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
          onChange={(e) => onFormDataChange('email', e.target.value)}
          className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 lead-form-input"
          placeholder="seu@email.com"
          required
        />
      </div>
    </div>
  );
};

export default PersonalInfoStep;
