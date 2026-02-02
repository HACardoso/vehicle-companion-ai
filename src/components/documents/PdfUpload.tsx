import { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface PdfUploadProps {
  vehicleId: string;
  onSuccess?: () => void;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export function PdfUpload({ vehicleId, onSuccess }: PdfUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Formato inválido. Envie um arquivo PDF.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Arquivo acima de 20 MB. Tamanho atual: ${(file.size / 1024 / 1024).toFixed(1)} MB`;
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    const validationError = validateFile(droppedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }

    setFile(droppedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const filePath = `${user.id}/${vehicleId}/${Date.now()}_${file.name}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('vehicle-documents')
        .upload(filePath, file);

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      setProgress(95);

      // Create document record
      const { error: dbError } = await supabase
        .from('vehicle_documents')
        .insert({
          vehicle_id: vehicleId,
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          status: 'ready', // In a real app, this would be 'processing' and updated by a backend job
          extracted_text_length: 1000, // Placeholder - would be set by backend
        });

      if (dbError) throw dbError;

      setProgress(100);

      toast({
        title: 'Documento pronto para usar',
        description: `${file.name} foi enviado com sucesso.`,
      });

      queryClient.invalidateQueries({ queryKey: ['vehicle-document', vehicleId] });
      onSuccess?.();
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar arquivo');
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível enviar o arquivo. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <Card
        className={cn(
          'border-2 border-dashed transition-colors cursor-pointer',
          error ? 'border-destructive/50 bg-destructive/5' : 'border-border hover:border-primary/50',
          file && !error && 'border-success/50 bg-success/5'
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />

          {!file ? (
            <>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">
                Arraste o PDF aqui ou clique para selecionar
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Envie o manual do seu veículo (PDF até 20 MB)
              </p>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Requisito: Envie um PDF até 20 MB
            </p>
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Enviando...</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Upload button */}
      {file && !error && (
        <Button
          className="w-full gap-2"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Enviar
            </>
          )}
        </Button>
      )}
    </div>
  );
}
