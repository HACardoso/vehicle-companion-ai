import { Link } from "react-router-dom";
import { Car, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <Car className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-display font-bold text-foreground">404</h1>
          <p className="text-lg text-muted-foreground">Página não encontrada</p>
        </div>
        
        <Link to="/dashboard">
          <Button className="gap-2">
            <Home className="h-4 w-4" />
            Voltar ao início
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
