
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Upload, Copy, QrCode, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentScreenProps {
  leadId: string;
  onComplete: () => void;
  onBackToForm: () => void;
  paymentValue?: string;
  pixKey?: string;
  qrCodeUrl?: string;
}

const PaymentScreen = ({ 
  leadId, 
  onComplete, 
  onBackToForm,
  paymentValue = "R$ 200,00",
  pixKey = "pagamento@instituicao.com.br",
  qrCodeUrl = ""
}: PaymentScreenProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, selecione apenas imagens.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUploadReceipt = async () => {
    if (!selectedFile) {
      toast({
        title: "Selecione um arquivo",
        description: "Por favor, selecione o comprovante de pagamento.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create file name with timestamp
      const timestamp = Date.now();
      const fileName = `receipts/${leadId}_${timestamp}.${selectedFile.name.split('.').pop()}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      // Update lead with receipt URL
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          receipt_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (updateError) throw updateError;

      toast({
        title: "Comprovante enviado!",
        description: "Seu comprovante foi enviado com sucesso. Entraremos em contato em breve!",
      });

      onComplete();
    } catch (error) {
      console.error('Erro ao enviar comprovante:', error);
      toast({
        title: "Erro ao enviar",
        description: "Erro ao enviar comprovante. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey).then(() => {
      toast({
        title: "Chave PIX copiada!",
        description: "A chave PIX foi copiada para a área de transferência.",
      });
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <CreditCard className="w-6 h-6" />
            Finalizar Pagamento
          </CardTitle>
          <p className="text-green-100 mt-2">Complete seu cadastro realizando o pagamento</p>
        </CardHeader>
        
        <CardContent className="p-8 space-y-6">
          {/* Payment Value */}
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Valor do Investimento</h3>
              <div className="text-3xl font-bold text-green-600">{paymentValue}</div>
            </div>
          </div>

          {/* QR Code Section */}
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

          {/* PIX Key */}
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

          {/* File Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Enviar Comprovante
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="receipt">Selecione o comprovante de pagamento</Label>
              <Input
                id="receipt"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-sm text-gray-500">
                Formatos aceitos: JPG, PNG, GIF (máximo 5MB)
              </p>
            </div>

            {previewUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Pré-visualização:</p>
                <img 
                  src={previewUrl} 
                  alt="Preview do comprovante" 
                  className="max-w-full h-48 object-contain border border-gray-200 rounded"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              onClick={onBackToForm}
              variant="outline"
              className="flex-1"
            >
              Voltar ao Cadastro
            </Button>
            
            <Button
              onClick={handleUploadReceipt}
              disabled={!selectedFile || isUploading}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              {isUploading ? 'Enviando...' : 'Finalizar Cadastro'}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600 mt-4">
            <p>Após o envio do comprovante, nossa equipe entrará em contato em até 24 horas.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentScreen;
