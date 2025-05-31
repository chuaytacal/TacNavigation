
'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { RouteManagementTable } from '@/components/admin/route-management-table';
import { getRoutes, toggleRouteStatusAction } from '@/lib/actions';
import type { Route } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadRoutes = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedRoutes = await getRoutes();
      setRoutes(fetchedRoutes.sort((a, b) => a.id.localeCompare(b.id))); // Sort by ID
    } catch (error) {
      console.error("Failed to load routes:", error);
      toast({ variant: 'destructive', title: 'Error al Cargar Rutas', description: 'No se pudieron obtener las rutas. Intente de nuevo.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const handleToggleRouteStatus = async (routeId: string) => {
    const originalRoutes = [...routes];
    const routeToToggle = routes.find(r => r.id === routeId);
    if (!routeToToggle) return;

    // Optimistic update
    setRoutes(prevRoutes =>
      prevRoutes.map(route =>
        route.id === routeId
          ? { ...route, status: route.status === 'open' ? 'blocked' : 'open' }
          : route
      )
    );

    try {
      const updatedRoute = await toggleRouteStatusAction(routeId);
      if (updatedRoute) {
        toast({
          title: 'Estado de Ruta Actualizado',
          description: `La ruta "${updatedRoute.name}" ahora está ${updatedRoute.status === 'open' ? 'abierta' : 'bloqueada'}.`,
        });
      } else {
        throw new Error("Route not found or update failed on server");
      }
    } catch (error) {
      console.error("Failed to toggle route status:", error);
      toast({ variant: 'destructive', title: 'Error al Actualizar', description: `No se pudo cambiar el estado de la ruta "${routeToToggle.name}".` });
      setRoutes(originalRoutes); // Revert on error
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <main className="flex-grow flex items-center justify-center p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Cargando Panel de Administración...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow p-4 md:p-8">
        <div className="container mx-auto">
           <RouteManagementTable 
             routes={routes} 
             onToggleRouteStatus={handleToggleRouteStatus}
             isLoading={isLoading}
           />
        </div>
      </main>
    </div>
  );
}
