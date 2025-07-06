
import React from 'react';
import { Label } from '@/components/ui/label';
import { CreditCard, QrCode, Copy } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Valor do Pagamento */}
      <div className="text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2 flex items-center justify-center gap-2">
            <CreditCard className="w-5 h-5" />
            Valor do Investimento
          </h3>
          <div className="text-3xl font-bold text-green-600">{paymentValue}</div>
        </div>
      </div>

      {/* QR Code PIX */}
      {qrCodeUrl && (
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code PIX
          </h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 inline-block">
            <img src={qrCodeUrl} alt="QR Code PIX" className="w-48 h-48 mx-auto" />
          </div>
          <p className="text-sm text-gray-600 mt-2">Escaneie o QR Code com seu app do banco</p>
        </div>
      )}

      {/* Chave PIX */}
      <div className="space-y-2">
        <Label className="text-gray-700 font-medium">Chave PIX</Label>
        <div className="flex gap-2">
          <Input
            value={pixKey}
            readOnly
            className="bg-gray-50 font-mono text-sm"
          />
          <Button onClick={copyPixKey} variant="outline" size="sm">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="text-center text-sm text-gray-600 mt-4 p-4 bg-blue-50 rounded-lg">
        <p><strong>Instruções de Pagamento:</strong></p>
        <p>1. Faça o pagamento via PIX usando a chave ou QR Code acima</p>
        <p>2. Na próxima etapa, envie o comprovante de pagamento</p>
        <p>3. Aguarde a confirmação da nossa equipe</p>
      </div>
    </div>
  );
};

export default PaymentStep;
