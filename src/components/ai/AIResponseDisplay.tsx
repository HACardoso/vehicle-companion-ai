import { AlertTriangle, BookOpen, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AIResponse, ResponseSection, PdfReference } from '@/types/vehicle';
import { cn } from '@/lib/utils';

interface AIResponseDisplayProps {
  response: AIResponse;
  className?: string;
}

export function AIResponseDisplay({ response, className }: AIResponseDisplayProps) {
  return (
    <div className={cn('space-y-4 animate-slide-up', className)}>
      {/* Safety Alert */}
      {response.safety_alert && (
        <div className="safety-alert animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h4 className="font-semibold text-destructive">Alerta de segurança</h4>
              <p className="mt-1 text-sm text-foreground">{response.safety_alert.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Response Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1.5 bg-primary/5 text-primary border-primary/20">
          <BookOpen className="h-3 w-3" />
          Resposta gerada por IA
        </Badge>
      </div>

      {/* Response Sections */}
      {response.sections.map((section, index) => (
        <ResponseSectionCard key={index} section={section} />
      ))}

      {/* Base Used */}
      {response.base_used && (
        <Card className="bg-muted/30 border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Base usada
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {response.base_used.source === 'pdf' ? (
              <div className="space-y-2">
                <p className="text-sm">
                  PDF do usuário: <span className="font-medium">{response.base_used.file_name}</span>
                </p>
                {response.base_used.no_relevant_excerpt ? (
                  <p className="text-sm text-muted-foreground italic">
                    Sem trecho relevante encontrado
                  </p>
                ) : (
                  response.base_used.references && (
                    <div className="flex flex-wrap gap-2">
                      {response.base_used.references.map((ref, i) => (
                        <PdfReferenceTag key={i} reference={ref} />
                      ))}
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Orientação geral (sem PDF associado)
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      {response.disclaimer && (
        <p className="text-xs text-muted-foreground text-center italic py-2">
          {response.disclaimer}
        </p>
      )}
    </div>
  );
}

function ResponseSectionCard({ section }: { section: ResponseSection }) {
  return (
    <Card className="ai-response-section border-0">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-base font-semibold">{section.title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {section.type === 'text' && typeof section.content === 'string' && (
          <p className="text-sm text-foreground leading-relaxed">{section.content}</p>
        )}

        {section.type === 'list' && Array.isArray(section.content) && (
          <ul className="space-y-2">
            {section.content.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {section.type === 'checklist' && Array.isArray(section.content) && (
          <ul className="space-y-2">
            {section.content.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <div className="flex h-5 w-5 items-center justify-center rounded border border-input bg-background text-xs font-medium">
                  {i + 1}
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function PdfReferenceTag({ reference }: { reference: PdfReference }) {
  return (
    <span className="pdf-reference">
      <FileText className="h-3 w-3" />
      página {reference.page}
    </span>
  );
}
