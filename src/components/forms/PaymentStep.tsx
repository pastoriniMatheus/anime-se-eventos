
import React from 'react';
import { Label } from '@/components/ui/label';
import { CreditCard, QrCode, Copy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface PaymentStepProps {
  paymentValue: string;
  pixKey: string;
  qrCodeUrl?: string;
}

const PaymentStep = ({ paymentValue, pixKey, qrCodeUrl }: PaymentStepProps) => {
  const { toast } = useToast();

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey).then(() => {
      toast({
        title: "Chave PIX copiada!",
        description: "A chave PIX foi copiada para a área de transferência.",
      });
    });
  };

  return (
    <div className="space-y-8">
      {/* Valor do Pagamento */}
      <div className="text-center">
        <div className="lead-form-payment-card p-8">
          <h3 className="text-xl font-bold mb-4 flex items-center justify-center gap-3">
            <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-white">
              <CreditCard className="w-6 h-6" />
            </div>
            Valor do Investimento
          </h3>
          <div className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            {paymentValue}
          </div>
          <div className="flex items-center justify-center gap-2 mt-3 text-gray-600">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Pagamento único via PIX</span>
          </div>
        </div>
      </div>

      {/* QR Code PIX */}
      {qrCodeUrl && (
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-6 flex items-center justify-center gap-3">
            <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-white">
              <QrCode className="w-5 h-5" />
            </div>
            QR Code PIX
          </h3>
          <div className="lead-form-qr-section p-6 inline-block">
            <img src={qrCodeUrl} alt="QR Code PIX" className="w-56 h-56 mx-auto rounded-xl shadow-lg" />
          </div>
          <p className="text-sm text-gray-600 mt-4 font-medium">
            📱 Escaneie o QR Code com seu app do banco
          </p>
        </div>
      )}

      {/* Chave PIX */}
      <div className="space-y-3">
        <Label className="text-gray-700 font-semibold text-base">🔑 Chave PIX</Label>
        <div className="flex gap-3">
          <Input
            value={pixKey}
            readOnly
            className="lead-form-input font-mono text-sm bg-gradient-to-r from-gray-50 to-pink-50 border-pink-200"
          />
          <Button onClick={copyPixKey} variant="outline" size="sm" className="lead-form-button px-4">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="text-center text-sm text-gray-600 mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
        <div className="space-y-3">
          <p className="font-semibold text-base text-gray-800">📋 Instruções de Pagamento</p>
          <div className="space-y-2 text-left">
            <p className="flex items-center gap-2">
              <span className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              Faça o pagamento via PIX usando a chave ou QR Code acima
            </p>
            <p className="flex items-center gap-2">
              <span className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              Na próxima etapa, envie o comprovante de pagamento
            </p>
            <p className="flex items-center gap-2">
              <span className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              Aguarde a confirmação da nossa equipe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStep;
