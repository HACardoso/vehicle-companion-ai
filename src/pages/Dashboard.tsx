import { Car, Plus } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import { AddVehicleDialog } from '@/components/vehicles/AddVehicleDialog';
import { useVehicles } from '@/hooks/useVehicles';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function Dashboard() {
  const { data: vehicles, isLoading } = useVehicles();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Meus Veículos</h1>
            <p className="text-muted-foreground">
              Gerencie seus veículos e documentos
            </p>
          </div>
          <AddVehicleDialog />
        </div>

        {/* Vehicles Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : vehicles?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Car className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Nenhum veículo cadastrado</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Adicione seu primeiro veículo para começar a usar o assistente de diagnóstico.
              </p>
              <div className="mt-6">
                <AddVehicleDialog />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles?.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
