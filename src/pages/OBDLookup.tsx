import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VehicleSelector } from '@/components/ai/VehicleSelector';
import { AIResponseDisplay } from '@/components/ai/AIResponseDisplay';
import { useVehicleDocument } from '@/hooks/useVehicles';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AIResponse } from '@/types/vehicle';

// OBD-II code regex: P/B/C/U + 4 alphanumeric characters
const OBD_REGEX = /^[PBCU][0-9A-Fa-f]{4}$/;

export default function OBDLookup() {
  const [searchParams] = useSearchParams();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    searchParams.get('vehicle') || ''
  );
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: document } = useVehicleDocument(selectedVehicleId);
  const { toast } = useToast();

  const hasValidDocument = document?.status === 'ready';

  const validateCode = (value: string): string | null => {
    const upperCode = value.toUpperCase().trim();
    if (!upperCode) return 'Informe um código OBD-II';
    if (!OBD_REGEX.test(upperCode)) {
      return 'Código inválido. Exemplos válidos: P0300, U0100';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateCode(code);
    if (validationError) {
      setError(validationError);
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
          type: 'obd',
          vehicleId: selectedVehicleId,
          documentId: document?.id,
          input: { code: code.toUpperCase().trim() },
        },
      });

      if (fnError) throw fnError;
      
      setResponse(data as AIResponse);
    } catch (err) {
      console.error('OBD lookup error:', err);
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
            Explicar Código OBD-II
          </h1>
          <p className="text-muted-foreground">
            Informe o código do scanner e receba uma explicação detalhada
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Consulta OBD-II</CardTitle>
            <CardDescription>
              Digite o código exibido pelo scanner do seu veículo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <VehicleSelector
              selectedVehicleId={selectedVehicleId}
              onSelect={setSelectedVehicleId}
            />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Código OBD-II</label>
                <Input
                  placeholder="Ex: P0300"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  className="font-mono text-lg uppercase"
                  maxLength={5}
                />
                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Formato: P/B/C/U seguido de 4 dígitos (ex: P0300, U0100)
                </p>
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={loading || !hasValidDocument || !selectedVehicleId}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Explicar com IA
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
