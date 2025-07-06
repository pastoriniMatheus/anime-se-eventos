
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-green-800 mb-2 flex items-center justify-center gap-2">
          <Upload className="w-5 h-5" />
          Enviar Comprovante de Pagamento
        </h3>
        <p className="text-gray-600">Envie o comprovante do pagamento PIX realizado</p>
      </div>

      <div className="space-y-4">
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
              className="max-w-full h-48 object-contain border border-gray-200 rounded mx-auto"
            />
          </div>
        )}

        <Button
          onClick={handleUploadReceipt}
          disabled={!selectedFile || isUploading}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
        >
          {isUploading ? 'Enviando...' : 'Finalizar Cadastro'}
          {!isUploading && <CheckCircle className="w-4 h-4 ml-2" />}
        </Button>
      </div>

      <div className="text-center text-sm text-gray-600 mt-4 p-4 bg-blue-50 rounded-lg">
        <p>Após o envio do comprovante, nossa equipe entrará em contato em até 24 horas para confirmar seu cadastro.</p>
      </div>
    </div>
  );
};

export default ReceiptUploadStep;
