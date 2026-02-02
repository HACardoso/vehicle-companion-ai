import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Loader2, AlertCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VehicleSelector } from '@/components/ai/VehicleSelector';
import { AIResponseDisplay } from '@/components/ai/AIResponseDisplay';
import { useVehicleDocument } from '@/hooks/useVehicles';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AIResponse } from '@/types/vehicle';

const MIN_SYMPTOMS_LENGTH = 30;

export default function Diagnosis() {
  const [searchParams] = useSearchParams();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    searchParams.get('vehicle') || ''
  );
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: document } = useVehicleDocument(selectedVehicleId);
  const { toast } = useToast();

  const hasValidDocument = document?.status === 'ready';
  const charactersRemaining = MIN_SYMPTOMS_LENGTH - symptoms.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (symptoms.length < MIN_SYMPTOMS_LENGTH) {
      setError(`Descreva os sintomas com pelo menos ${MIN_SYMPTOMS_LENGTH} caracteres.`);
      return;
    }

    if (!selectedVehicleId) {
      toast({
        title: 'Selecione um veículo',
        description: 'Escolha um veículo para realizar a consulta.',
        variant: 'destructive',
      });
      return;
    }

    if (!hasValidDocument) {
      toast({
        title: 'PDF não disponível',
        description: 'Envie um PDF válido do manual do veículo para continuar.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'diagnosis',
          vehicleId: selectedVehicleId,
          documentId: document?.id,
          input: { symptoms: symptoms.trim() },
        },
      });

      if (fnError) throw fnError;
      
      setResponse(data as AIResponse);
    } catch (err) {
      console.error('Diagnosis error:', err);
      toast({
        title: 'Erro na consulta',
        description: err instanceof Error ? err.message : 'Não foi possível processar a consulta.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Diagnóstico por Sintomas
          </h1>
          <p className="text-muted-foreground">
            Descreva o que você está percebendo no veículo
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Descreva os sintomas</CardTitle>
            <CardDescription>
              Quanto mais detalhes, melhor será o diagnóstico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <VehicleSelector
              selectedVehicleId={selectedVehicleId}
              onSelect={setSelectedVehicleId}
            />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">O que você está percebendo?</label>
                <Textarea
                  placeholder="Ex: O carro está fazendo um barulho estranho quando acelero, parece vir do motor. Também percebi que o consumo de combustível aumentou nas últimas semanas..."
                  value={symptoms}
                  onChange={(e) => {
                    setSymptoms(e.target.value);
                    setError(null);
                  }}
                  className="min-h-[120px] resize-none"
                />
                <div className="flex items-center justify-between text-xs">
                  <div>
                    {error ? (
                      <span className="flex items-center gap-1 text-destructive">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {error}
                      </span>
                    ) : charactersRemaining > 0 ? (
                      <span className="text-muted-foreground">
                        Ainda faltam {charactersRemaining} caracteres
                      </span>
                    ) : (
                      <span className="text-success">✓ Descrição suficiente</span>
                    )}
                  </div>
                  <span className="text-muted-foreground">{symptoms.length} caracteres</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={loading || !hasValidDocument || !selectedVehicleId || symptoms.length < MIN_SYMPTOMS_LENGTH}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Gerar diagnóstico com IA
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {response && <AIResponseDisplay response={response} />}
      </div>
    </MainLayout>
  );
}
