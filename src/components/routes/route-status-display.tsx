
'use client';

import type { Route } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, AlertTriangle, CheckCircle, FastForward } from 'lucide-react';

interface RouteStatusDisplayProps {
  routes: Route[];
  maxHeight?: string;
}

export function RouteStatusDisplay({ routes, maxHeight = '400px' }: RouteStatusDisplayProps) {
  if (!routes || routes.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No hay información de rutas disponible.</p>;
  }

  const getStatusProps = (status: Route['status']) => {
    switch (status) {
      case 'open':
        return { variant: 'default', icon: <CheckCircle className="h-3 w-3" />, text: 'Abierta' };
      case 'blocked':
        return { variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" />, text: 'Bloqueada' };
      case 'congested':
        return { variant: 'secondary', icon: <FastForward className="h-3 w-3 text-orange-500" />, text: 'Congestionada' }; // Using secondary, consider custom variant for yellow/orange
      default:
        return { variant: 'outline', icon: <MapPin className="h-3 w-3" />, text: 'Desconocido' };
    }
  };

  return (
    <ScrollArea className="pr-3" style={{ height: maxHeight }}>
      <div className="space-y-3">
        {routes.map((route) => {
          const statusProps = getStatusProps(route.status);
          return (
            <Card key={route.id} className="overflow-hidden hover:shadow-md transition-shadow bg-card border">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-6 w-6 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-md font-semibold text-card-foreground">{route.name}</p>
                    <p className="text-xs text-muted-foreground">{route.pathDescription}</p>
                  </div>
                </div>
                <Badge variant={statusProps.variant} className="flex items-center gap-1.5 py-1 px-2.5 text-xs whitespace-nowrap">
                  {statusProps.icon}
                  {statusProps.text}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
