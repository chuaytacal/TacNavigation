
'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { MapComponent, MapControlWrapper } from '@/components/map/map-component';
import { RoutePlanner } from '@/components/map/route-planner';
import { CommentSubmissionForm } from '@/components/forms/comment-submission-form';
import { PublicCommentViewer } from '@/components/comments/public-comment-viewer';
import { RouteStatusDisplay } from '@/components/routes/route-status-display';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { getObstructions as fetchObstructions, getComments as fetchComments, getRoutes } from '@/lib/actions';
import type { Obstruction, GeoCoordinates, Comment, Route } from '@/lib/types';
import { MessageSquarePlus, Loader2 } from 'lucide-react';
import { ControlPosition } from '@vis.gl/react-google-maps';
import { useToast } from '@/hooks/use-toast';

const TACNA_CENTER: GeoCoordinates = { lat: -18.0146, lng: -70.2534 };
const HEADER_HEIGHT = '4rem'; 
const PAGE_VERTICAL_PADDING = '2rem'; 
const SIDEBAR_TOP_OFFSET = `calc(${HEADER_HEIGHT} + 1rem)`;
const CONTENT_EFFECTIVE_MAX_HEIGHT = `calc(100vh - ${HEADER_HEIGHT} - ${PAGE_VERTICAL_PADDING} - 12rem)`; // Adjusted for welcome text + map title

export default function HomePage() {
  const [obstructions, setObstructions] = useState<Obstruction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [currentRoute, setCurrentRoute] = useState<google.maps.DirectionsResult | null>(null);
  const [isLoadingObstructions, setIsLoadingObstructions] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoadingObstructions(true);
        const fetchedObstructions = await fetchObstructions();
        setObstructions(fetchedObstructions);
      } catch (error) {
        console.error("Failed to load obstructions:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load road obstructions.' });
      } finally {
        setIsLoadingObstructions(false);
      }

      try {
        setIsLoadingComments(true);
        const fetchedComments = await fetchComments();
        setComments(fetchedComments.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
      } catch (error) {
        console.error("Failed to load comments:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load user comments.' });
      } finally {
        setIsLoadingComments(false);
      }

      try {
        setIsLoadingRoutes(true);
        const fetchedRoutes = await getRoutes();
        setRoutes(fetchedRoutes);
      } catch (error) {
        console.error("Failed to load routes:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las rutas.'});
      } finally {
        setIsLoadingRoutes(false);
      }
    }
    loadData();
  }, [toast]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow flex flex-col p-4">
        <section className="mb-6 text-left">
          <h1 className="text-3xl font-bold text-primary font-headline mb-2">
            Bienvenido a Tacna Transit Navigator
          </h1>
          <p className="text-lg text-muted-foreground">
            Optimice sus viajes en bus por Tacna. Evite congestiones y rutas bloqueadas.
          </p>
        </section>

        <div className="flex-grow flex flex-col lg:flex-row gap-4">
          <aside 
            className="lg:w-1/3 xl:w-1/4 space-y-4 order-last lg:order-first 
                       lg:sticky lg:top-[var(--sidebar-top-offset)] 
                       h-full lg:max-h-[var(--content-max-height)]
                       lg:overflow-y-auto rounded-lg shadow-lg border bg-card p-4"
            style={{ '--sidebar-top-offset': SIDEBAR_TOP_OFFSET, '--content-max-height': CONTENT_EFFECTIVE_MAX_HEIGHT } as React.CSSProperties}
          >
            <RoutePlanner onRouteCalculated={setCurrentRoute} obstructions={obstructions} />
          </aside>

          <section 
            className="lg:w-2/3 xl:w-3/4 order-first lg:order-last 
                       flex flex-col h-fit lg:h-[var(--content-max-height)]
                       rounded-lg shadow-lg border overflow-hidden bg-card"
            style={{ '--content-max-height': CONTENT_EFFECTIVE_MAX_HEIGHT } as React.CSSProperties}
          >
            <div className="p-4 border-b">
              <h2 className="text-2xl font-semibold text-foreground mb-1">
                Mapa de Rutas de Tacna
              </h2>
              <p className="text-sm text-muted-foreground">
                Visualización del estado actual de las rutas. Puede seleccionar origen y destino en el formulario de la izquierda.
              </p>
               <p className="text-xs text-muted-foreground mt-1">
                Leyenda del mapa: Rutas bloqueadas se indican en rojo discontinuo, abiertas en azul. Origen (círculo) y destino (flecha) se marcan en naranja.
              </p>
            </div>
            <div className="flex-grow h-[50vh] lg:h-full">
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" /> 
                  <p className="ml-4 text-lg">Cargando Mapa...</p>
                </div>
              }>
                <MapComponent
                  initialCenter={TACNA_CENTER}
                  initialZoom={14}
                  obstructionsToDisplay={obstructions}
                  routeToDisplay={currentRoute}
                  enableTrafficLayer={true}
                  interactive={true}
                >
                  <MapControlWrapper position={ControlPosition.BOTTOM_RIGHT}>
                     <Dialog open={isCommentFormOpen} onOpenChange={setIsCommentFormOpen}>
                        <DialogTrigger asChild>
                          <Button variant="default" size="lg" className="shadow-xl bg-accent hover:bg-accent/90 text-accent-foreground">
                            <MessageSquarePlus className="mr-2 h-5 w-5" /> Reportar Incidencia
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg p-0">
                           <CommentSubmissionForm />
                        </DialogContent>
                      </Dialog>
                  </MapControlWrapper>
                </MapComponent>
              </Suspense>
            </div>
          </section>
        </div>

        <section className="pt-6 border-t mt-6 bg-background">
          <div className="container mx-auto px-0">
            <h2 className="text-2xl font-bold mb-4 text-primary font-headline">Estado de las Rutas</h2>
            {isLoadingRoutes ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Cargando estado de rutas...</p>
              </div>
            ) : (
              <RouteStatusDisplay routes={routes} />
            )}
          </div>
        </section>

        <section className="pt-6 border-t mt-6 bg-background">
          <div className="container mx-auto px-0">
            <h2 className="text-2xl font-bold mb-4 text-primary font-headline">Comentarios de Usuarios</h2>
            {isLoadingComments ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Cargando comentarios...</p>
              </div>
            ) : (
              <PublicCommentViewer comments={comments} maxHeight="50vh" />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
