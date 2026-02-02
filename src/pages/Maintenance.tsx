import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { VehicleSelector } from '@/components/ai/VehicleSelector';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { useVehicle, useVehicleDocument } from '@/hooks/useVehicles';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from '@/types/chat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, MessageSquare } from 'lucide-react';

export default function Maintenance() {
  const [searchParams] = useSearchParams();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    searchParams.get('vehicle') || ''
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: vehicle } = useVehicle(selectedVehicleId);
  const { data: document } = useVehicleDocument(selectedVehicleId);
  const { toast } = useToast();

  const handleSendMessage = useCallback(async (content: string) => {
    if (!selectedVehicleId || !document?.id) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    // Add user message and loading state
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: 'loading',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      // Build chat history for context
      const chatHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'maintenance-chat',
          vehicleId: selectedVehicleId,
          documentId: document.id,
          input: { message: content },
          chatHistory,
        },
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        references: data.references,
      };

      // Replace loading message with actual response
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== 'loading').concat(assistantMessage)
      );
    } catch (err) {
      console.error('Chat error:', err);
      // Remove loading message
      setMessages((prev) => prev.filter((msg) => msg.id !== 'loading'));
      toast({
        title: 'Erro ao enviar mensagem',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedVehicleId, document?.id, messages, toast]);

  // Reset messages when vehicle changes
  const handleVehicleChange = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setMessages([]);
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full max-w-5xl mx-auto gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              Chat de Manutenção
            </h1>
            <p className="text-muted-foreground">
              Pergunte sobre manutenção e receba respostas do manual
            </p>
          </div>

          <div className="w-full sm:w-64">
            <VehicleSelector
              selectedVehicleId={selectedVehicleId}
              onSelect={handleVehicleChange}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <ChatContainer
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              document={document || null}
              vehicleName={vehicle?.name}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Document Info */}
            {document && (
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Documento Ativo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium truncate">{document.file_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(document.file_size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  <div className="mt-3 pt-3 border-t border-border">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        document.status === 'ready'
                          ? 'bg-green-500/10 text-green-500'
                          : document.status === 'processing'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {document.status === 'ready'
                        ? '● Pronto para uso'
                        : document.status === 'processing'
                        ? '○ Processando...'
                        : '✕ Qualidade insuficiente'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* How it works */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Como funciona</CardTitle>
                <CardDescription className="text-xs">
                  O chat responde apenas com base no manual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                    1
                  </span>
                  <p className="text-muted-foreground">
                    Selecione um veículo com PDF enviado
                  </p>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                    2
                  </span>
                  <p className="text-muted-foreground">
                    Faça perguntas sobre manutenção ou intervalos
                  </p>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                    3
                  </span>
                  <p className="text-muted-foreground">
                    Receba respostas com referências de página
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Example questions */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Exemplos de perguntas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li>• Qual o intervalo de troca de óleo?</li>
                  <li>• Quando devo trocar o filtro de ar?</li>
                  <li>• Qual a pressão correta dos pneus?</li>
                  <li>• Quais são as revisões programadas?</li>
                  <li>• Como verificar o nível do fluido de freio?</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
