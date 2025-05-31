
'use client';

import type { Route } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Route as RouteIcon, FastForward } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface RouteManagementTableProps {
  routes: Route[];
  onToggleRouteStatus: (routeId: string) => Promise<void>; // Currently toggles between open/blocked
  isLoading: boolean;
}

export function RouteManagementTable({ routes, onToggleRouteStatus, isLoading }: RouteManagementTableProps) {
  if (isLoading) {
    return <p className="text-muted-foreground">Cargando rutas...</p>;
  }
  
  if (!routes || routes.length === 0) {
    return <p className="text-muted-foreground">No hay rutas para administrar.</p>;
  }

  const getStatusBadge = (status: Route['status']) => {
    switch (status) {
      case 'open':
        return <Badge variant="default" className="flex items-center gap-1 justify-center"><CheckCircle className="h-3 w-3" />Abierta</Badge>;
      case 'blocked':
        return <Badge variant="destructive" className="flex items-center gap-1 justify-center"><AlertTriangle className="h-3 w-3" />Bloqueada</Badge>;
      case 'congested':
        // For admin, 'congested' is shown, but not toggled by the simple switch.
        // This might need a more complex status management UI if admin should set 'congested'.
        return <Badge variant="secondary" className="flex items-center gap-1 justify-center text-orange-600 border-orange-500/50"><FastForward className="h-3 w-3" />Congestionada</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <RouteIcon className="mr-2 h-6 w-6 text-primary" /> Administrar Rutas de Buses
        </CardTitle>
        <CardDescription>
          Gestione el estado de las rutas de buses (Abierta/Bloqueada). El estado 'Congestionada' es informativo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>Administre el estado de las rutas de buses. Los cambios se reflejarán para los usuarios.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID Ruta</TableHead>
              <TableHead>Nombre de Ruta</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-center">Estado Actual</TableHead>
              <TableHead className="text-right">Cambiar Estado (Bloquear/Abrir)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.map((route) => (
              <TableRow key={route.id} className={route.status === 'blocked' ? 'bg-destructive/10' : route.status === 'congested' ? 'bg-yellow-500/10' : ''}>
                <TableCell className="font-medium">{route.id}</TableCell>
                <TableCell>{route.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{route.pathDescription}</TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(route.status)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                     {/* Switch only toggles open/blocked. Congested status is managed via data or future complex logic. */}
                    <span className="text-sm text-muted-foreground">
                      {route.status === 'open' || route.status === 'congested' ? 'Bloquear' : 'Abrir'}
                    </span>
                    <Switch
                      id={`status-${route.id}`}
                      checked={route.status === 'blocked'} 
                      onCheckedChange={() => onToggleRouteStatus(route.id)} // This action only knows open/blocked
                      aria-label={`Cambiar estado de ${route.name} (abierta/bloqueada)`}
                      className="data-[state=checked]:bg-accent data-[state=unchecked]:bg-primary/70"
                      disabled={route.status === 'congested'} // Disable switch if congested, as it's not part of simple toggle
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
