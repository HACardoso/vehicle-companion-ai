import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Car, FileText, Edit, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PdfUpload } from '@/components/documents/PdfUpload';
import { DocumentStatus } from '@/components/documents/DocumentStatus';
import { useVehicle, useVehicleDocument, useDeleteVehicle } from '@/hooks/useVehicles';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function VehicleDetail() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { data: vehicle, isLoading: loadingVehicle } = useVehicle(vehicleId);
  const { data: document, isLoading: loadingDocument } = useVehicleDocument(vehicleId);
  const { mutate: deleteVehicle, isPending: deleting } = useDeleteVehicle();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDelete = () => {
    if (!vehicleId) return;
    
    deleteVehicle(vehicleId, {
      onSuccess: () => {
        toast({ title: 'Veículo excluído' });
        navigate('/dashboard');
      },
      onError: (error) => {
        toast({
          title: 'Erro ao excluir',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  if (loadingVehicle) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!vehicle) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Veículo não encontrado</p>
          <Link to="/dashboard">
            <Button variant="link" className="mt-4">
              Voltar ao início
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Back button */}
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>

        {/* Vehicle Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Car className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-foreground">
                    {vehicle.name}
                  </h1>
                  <p className="text-muted-foreground">
                    {[vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' • ') || 'Sem detalhes'}
                  </p>
                  {vehicle.current_mileage > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {vehicle.current_mileage.toLocaleString('pt-BR')} km
                    </p>
                  )}
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir veículo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. O veículo e todos os documentos associados serão excluídos permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {deleting ? 'Excluindo...' : 'Excluir'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Document Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Manual do Veículo (PDF)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingDocument ? (
              <Skeleton className="h-24 w-full" />
            ) : document ? (
              <div className="space-y-4">
                <DocumentStatus document={document} />
                
                {document.status !== 'ready' && (
                  <div className="pt-2">
                    <p className="text-sm font-medium text-foreground mb-3">
                      Enviar novo documento:
                    </p>
                    <PdfUpload vehicleId={vehicleId!} />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Envie o PDF do manual do seu veículo para que a IA possa fornecer respostas mais precisas e alinhadas ao seu carro.
                </p>
                <PdfUpload vehicleId={vehicleId!} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {document?.status === 'ready' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Consultas disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <Link to={`/obd?vehicle=${vehicleId}`}>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    Explicar código OBD-II
                  </Button>
                </Link>
                <Link to={`/diagnosis?vehicle=${vehicleId}`}>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    Diagnóstico por sintomas
                  </Button>
                </Link>
                <Link to={`/maintenance?vehicle=${vehicleId}`}>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    Manutenção preventiva
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
