
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, FileImage, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReceiptUploadStepProps {
  leadId: string;
  onUploadComplete: () => void;
}

const ReceiptUploadStep = ({ leadId, onUploadComplete }: ReceiptUploadStepProps) => {
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

      onUploadComplete();
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

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-white">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-green-800">Enviar Comprovante</h3>
            <p className="text-green-600">Quase lá! Só falta o comprovante do PIX</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label htmlFor="receipt" className="text-base font-semibold text-gray-700">
            📎 Selecione o comprovante de pagamento
          </Label>
          
          <div className="lead-form-upload-area p-8 text-center cursor-pointer" 
               onClick={() => document.getElementById('receipt')?.click()}>
            <Input
              id="receipt"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                <FileImage className="w-8 h-8 text-white" />
              </div>
              
              <div>
                <p className="text-lg font-semibold text-gray-700">
                  {selectedFile ? selectedFile.name : 'Clique para selecionar o arquivo'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Formatos aceitos: JPG, PNG, GIF (máximo 5MB)
                </p>
              </div>
            </div>
          </div>
        </div>

        {previewUrl && (
          <div className="space-y-4">
            <Label className="text-base font-semibold text-gray-700">
              👁️ Pré-visualização
            </Label>
            <div className="lead-form-qr-section p-4">
              <img 
                src={previewUrl} 
                alt="Preview do comprovante" 
                className="max-w-full h-64 object-contain mx-auto rounded-lg shadow-md"
              />
            </div>
          </div>
        )}

        <Button
          onClick={handleUploadReceipt}
          disabled={!selectedFile || isUploading}
          className="w-full py-4 text-lg font-semibold lead-form-button"
        >
          {isUploading ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
              Enviando...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-3" />
              Finalizar Cadastro
            </>
          )}
        </Button>
      </div>

      <div className="text-center text-sm text-gray-600 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CheckCircle className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-blue-800">Última etapa!</span>
        </div>
        <p>Após o envio do comprovante, nossa equipe entrará em contato em até 24 horas para confirmar seu cadastro.</p>
      </div>
    </div>
  );
};

export default ReceiptUploadStep;
