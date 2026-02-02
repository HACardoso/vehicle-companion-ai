import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateVehicle } from '@/hooks/useVehicles';
import { useToast } from '@/hooks/use-toast';

export function AddVehicleDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [mileage, setMileage] = useState('');

  const { mutate: createVehicle, isPending } = useCreateVehicle();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe um nome para o veículo.',
        variant: 'destructive',
      });
      return;
    }

    createVehicle(
      {
        name: name.trim(),
        brand: brand.trim() || null,
        model: model.trim() || null,
        year: year ? parseInt(year) : null,
        license_plate: licensePlate.trim() || null,
        current_mileage: mileage ? parseInt(mileage) : 0,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Veículo adicionado',
            description: 'Seu veículo foi cadastrado com sucesso.',
          });
          setOpen(false);
          resetForm();
        },
        onError: (error) => {
          toast({
            title: 'Erro ao adicionar',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const resetForm = () => {
    setName('');
    setBrand('');
    setModel('');
    setYear('');
    setLicensePlate('');
    setMileage('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Veículo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar Veículo</DialogTitle>
            <DialogDescription>
              Cadastre seu veículo para associar o manual e realizar consultas.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do veículo *</Label>
              <Input
                id="name"
                placeholder="Ex: Meu Civic"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  placeholder="Ex: Honda"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  placeholder="Ex: Civic"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="year">Ano</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="Ex: 2022"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mileage">Quilometragem</Label>
                <Input
                  id="mileage"
                  type="number"
                  placeholder="Ex: 15000"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="licensePlate">Placa</Label>
              <Input
                id="licensePlate"
                placeholder="Ex: ABC-1234"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
