
'use client';

import type { Route } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Route as RouteIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface RouteManagementTableProps {
  routes: Route[];
  onToggleRouteStatus: (routeId: string) => Promise<void>;
  isLoading: boolean;
}

export function RouteManagementTable({ routes, onToggleRouteStatus, isLoading }: RouteManagementTableProps) {
  if (isLoading) {
    return <p className="text-muted-foreground">Cargando rutas...</p>;
  }
  
  if (!routes || routes.length === 0) {
    return <p className="text-muted-foreground">No hay rutas para administrar.</p>;
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <RouteIcon className="mr-2 h-6 w-6 text-primary" /> Administrar Rutas de Buses
        </CardTitle>
        <CardDescription>
          Gestione el estado de las rutas de buses. Los cambios se reflejarán para los usuarios.
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
              <TableRow key={route.id} className={route.status === 'blocked' ? 'bg-destructive/10' : ''}>
                <TableCell className="font-medium">{route.id}</TableCell>
                <TableCell>{route.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{route.pathDescription}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={route.status === 'blocked' ? 'destructive' : 'default'} className="flex items-center gap-1 justify-center">
                    {route.status === 'blocked' ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                    {route.status === 'blocked' ? 'Bloqueada' : 'Abierta'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {route.status === 'open' ? 'Bloquear' : 'Abrir'}
                    </span>
                    <Switch
                      id={`status-${route.id}`}
                      checked={route.status === 'blocked'}
                      onCheckedChange={() => onToggleRouteStatus(route.id)}
                      aria-label={`Cambiar estado de ${route.name}`}
                      className="data-[state=checked]:bg-accent data-[state=unchecked]:bg-primary/70"
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
