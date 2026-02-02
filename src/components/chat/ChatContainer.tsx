import { useRef, useEffect } from 'react';
import { MessageSquare, FileText, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { VehicleDocument } from '@/types/vehicle';

interface ChatContainerProps {
  messages: ChatMessageType[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  document: VehicleDocument | null;
  vehicleName?: string;
}

export function ChatContainer({
  messages,
  onSendMessage,
  isLoading,
  document,
  vehicleName,
}: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasValidDocument = document?.status === 'ready';

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Assistente de Manutenção</h3>
            <p className="text-xs text-muted-foreground">
              {vehicleName || 'Selecione um veículo'}
            </p>
          </div>
        </div>

        {document && (
          <div className="flex items-center gap-2 text-xs">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground max-w-[150px] truncate">
              {document.file_name}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                hasValidDocument
                  ? 'status-ready'
                  : 'status-processing'
              }`}
            >
              {hasValidDocument ? 'Pronto' : 'Processando'}
            </span>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <EmptyState hasValidDocument={hasValidDocument} />
          ) : (
            messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      {!hasValidDocument ? (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 text-warning shrink-0" />
            <span>
              Envie um PDF válido do manual do veículo para usar o chat.
            </span>
          </div>
        </div>
      ) : (
        <ChatInput
          onSend={onSendMessage}
          disabled={isLoading}
          placeholder="Pergunte sobre manutenção, intervalos, procedimentos..."
        />
      )}
    </div>
  );
}

function EmptyState({ hasValidDocument }: { hasValidDocument: boolean }) {
  const suggestions = [
    'Qual o intervalo de troca de óleo?',
    'Quando devo trocar o filtro de ar?',
    'Qual a pressão correta dos pneus?',
    'Quais são as revisões programadas?',
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
        <MessageSquare className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Chat de Manutenção</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {hasValidDocument
          ? 'Faça perguntas sobre manutenção e intervalos de serviço. As respostas são baseadas exclusivamente no manual do seu veículo.'
          : 'Envie um PDF do manual do veículo para começar a conversar.'}
      </p>

      {hasValidDocument && (
        <div className="grid gap-2 w-full max-w-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Sugestões
          </p>
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              className="text-left text-sm px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-transparent hover:border-border"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
