import { Car, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVehicles, useVehicleDocument } from '@/hooks/useVehicles';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface VehicleSelectorProps {
  selectedVehicleId: string | undefined;
  onSelect: (vehicleId: string) => void;
  requireDocument?: boolean;
  className?: string;
}

export function VehicleSelector({
  selectedVehicleId,
  onSelect,
  requireDocument = true,
  className,
}: VehicleSelectorProps) {
  const { data: vehicles, isLoading } = useVehicles();
  const { data: document } = useVehicleDocument(selectedVehicleId);

  const selectedVehicle = vehicles?.find((v) => v.id === selectedVehicleId);
  const hasValidDocument = document?.status === 'ready';

  const showDocumentWarning = requireDocument && selectedVehicleId && !hasValidDocument;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Car className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Selecione o veículo</span>
      </div>

      <Select value={selectedVehicleId} onValueChange={onSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Escolha um veículo" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>
              Carregando...
            </SelectItem>
          ) : vehicles?.length === 0 ? (
            <SelectItem value="empty" disabled>
              Nenhum veículo cadastrado
            </SelectItem>
          ) : (
            vehicles?.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                <div className="flex items-center gap-2">
                  <span>{vehicle.name}</span>
                  {vehicle.brand && vehicle.model && (
                    <span className="text-muted-foreground">
                      ({vehicle.brand} {vehicle.model})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Document status */}
      {selectedVehicleId && (
        <div className="flex items-center gap-2">
          {hasValidDocument ? (
            <Badge variant="outline" className="status-ready gap-1.5">
              <FileText className="h-3 w-3" />
              PDF pronto: {document?.file_name}
            </Badge>
          ) : (
            <Badge variant="outline" className="status-warning gap-1.5">
              <AlertCircle className="h-3 w-3" />
              {document?.status === 'insufficient_quality'
                ? 'PDF com qualidade insuficiente'
                : 'Sem PDF válido'}
            </Badge>
          )}
        </div>
      )}

      {/* Warning card */}
      {showDocumentWarning && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning shrink-0" />
              <p className="text-sm text-foreground">
                Para gerar respostas precisas, envie um PDF do manual do veículo.
              </p>
            </div>
            <Link to={`/vehicles/${selectedVehicleId}`}>
              <Button size="sm" variant="outline" className="shrink-0">
                Enviar PDF
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* No vehicles */}
      {!isLoading && vehicles?.length === 0 && (
        <Card className="border-muted">
          <CardContent className="flex items-center justify-between gap-4 py-3">
            <p className="text-sm text-muted-foreground">
              Cadastre um veículo para começar
            </p>
            <Link to="/dashboard">
              <Button size="sm">Adicionar veículo</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
