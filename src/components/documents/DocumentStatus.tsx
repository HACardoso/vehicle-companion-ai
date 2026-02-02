import { CheckCircle2, AlertCircle, Loader2, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VehicleDocument } from '@/types/vehicle';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DocumentStatusProps {
  document: VehicleDocument;
}

export function DocumentStatus({ document }: DocumentStatusProps) {
  const getStatusConfig = () => {
    switch (document.status) {
      case 'ready':
        return {
          label: 'Documento pronto para usar',
          icon: CheckCircle2,
          color: 'text-success',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/30',
        };
      case 'processing':
        return {
          label: 'Processando documento...',
          icon: Loader2,
          color: 'text-info',
          bgColor: 'bg-info/10',
          borderColor: 'border-info/30',
        };
      case 'insufficient_quality':
        return {
          label: 'PDF com qualidade insuficiente',
          icon: AlertCircle,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/30',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Card className={cn('border', config.borderColor, config.bgColor)}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', config.bgColor)}>
            <Icon className={cn('h-6 w-6', config.color, config.icon === Loader2 && 'animate-spin')} />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn('gap-1.5', config.color)}>
                <Icon className={cn('h-3 w-3', config.icon === Loader2 && 'animate-spin')} />
                {config.label}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{document.file_name}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Enviado em {format(new Date(document.uploaded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          </div>
        </div>

        {/* Quality instructions for insufficient quality */}
        {document.status === 'insufficient_quality' && (
          <div className="mt-4 space-y-2 rounded-lg bg-background/50 p-4">
            <p className="text-sm font-medium text-foreground">
              Para melhorar a qualidade:
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                Envie um PDF com texto selecionável (não apenas foto)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                Evite páginas borradas e com baixa resolução
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                Se possível, exporte direto do manual (não tire print)
              </li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
