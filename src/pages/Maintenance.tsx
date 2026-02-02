import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wrench, Loader2, AlertCircle, Copy, Check } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VehicleSelector } from '@/components/ai/VehicleSelector';
import { AIResponseDisplay } from '@/components/ai/AIResponseDisplay';
import { useVehicle, useVehicleDocument } from '@/hooks/useVehicles';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AIResponse } from '@/types/vehicle';
import { format, isAfter, parseISO } from 'date-fns';

export default function Maintenance() {
  const [searchParams] = useSearchParams();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    searchParams.get('vehicle') || ''
  );
  const [mileage, setMileage] = useState('');
  const [lastServiceDate, setLastServiceDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [customerMessage, setCustomerMessage] = useState<string | null>(null);
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<{ mileage?: string; date?: string }>({});

  const { data: vehicle } = useVehicle(selectedVehicleId);
  const { data: document } = useVehicleDocument(selectedVehicleId);
  const { toast } = useToast();

  const hasValidDocument = document?.status === 'ready';

  const validate = (): boolean => {
    const newErrors: { mileage?: string; date?: string } = {};
    
    const mileageNum = parseInt(mileage);
    if (!mileage || isNaN(mileageNum) || mileageNum < 0) {
      newErrors.mileage = 'Informe uma quilometragem válida (ex: 50000)';
    }

    if (!lastServiceDate) {
      newErrors.date = 'Informe a data do último serviço';
    } else {
      const selectedDate = parseISO(lastServiceDate);
      if (isAfter(selectedDate, new Date())) {
        newErrors.date = 'A data não pode ser no futuro';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

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
    setErrors({});
    setResponse(null);
    setCustomerMessage(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'maintenance',
          vehicleId: selectedVehicleId,
          documentId: document?.id,
          input: {
            current_mileage: parseInt(mileage),
            last_service_date: lastServiceDate,
          },
        },
      });

      if (fnError) throw fnError;
      
      setResponse(data as AIResponse);
    } catch (err) {
      console.error('Maintenance error:', err);
      toast({
        title: 'Erro na consulta',
        description: err instanceof Error ? err.message : 'Não foi possível processar a consulta.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCustomerMessage = async () => {
    if (!response) return;

    setGeneratingMessage(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'customer-message',
          vehicleId: selectedVehicleId,
          response: response,
          vehicleName: vehicle?.name,
        },
      });

      if (fnError) throw fnError;
      
      setCustomerMessage(data.message as string);
    } catch (err) {
      console.error('Customer message error:', err);
      toast({
        title: 'Erro ao gerar mensagem',
        description: 'Não foi possível gerar a mensagem.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingMessage(false);
    }
  };

  const copyMessage = async () => {
    if (!customerMessage) return;
    
    await navigator.clipboard.writeText(customerMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Mensagem copiada!' });
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Manutenção Preventiva
          </h1>
          <p className="text-muted-foreground">
            Receba recomendações de manutenção baseadas no manual
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações do veículo</CardTitle>
            <CardDescription>
              Informe os dados atuais para recomendações precisas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <VehicleSelector
              selectedVehicleId={selectedVehicleId}
              onSelect={setSelectedVehicleId}
            />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mileage">Quilometragem atual</Label>
                  <Input
                    id="mileage"
                    type="number"
                    placeholder="Ex: 50000"
                    value={mileage}
                    onChange={(e) => {
                      setMileage(e.target.value);
                      setErrors((prev) => ({ ...prev, mileage: undefined }));
                    }}
                  />
                  {errors.mileage && (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.mileage}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastService">Data do último serviço</Label>
                  <Input
                    id="lastService"
                    type="date"
                    value={lastServiceDate}
                    onChange={(e) => {
                      setLastServiceDate(e.target.value);
                      setErrors((prev) => ({ ...prev, date: undefined }));
                    }}
                    max={format(new Date(), 'yyyy-MM-dd')}
                  />
                  {errors.date && (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.date}
                    </span>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={loading || !hasValidDocument || !selectedVehicleId}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Wrench className="h-4 w-4" />
                    Gerar recomendação com IA
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {response && (
          <>
            <AIResponseDisplay response={response} />

            {/* Customer Message Generator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mensagem para o cliente</CardTitle>
                <CardDescription>
                  Gere uma mensagem pronta para enviar ao cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {customerMessage ? (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap">
                      {customerMessage}
                    </div>
                    <Button variant="outline" className="gap-2" onClick={copyMessage}>
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copiar mensagem
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={generateCustomerMessage}
                    disabled={generatingMessage}
                  >
                    {generatingMessage ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      'Gerar mensagem para o cliente'
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
