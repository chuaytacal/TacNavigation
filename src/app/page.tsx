
'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { MapComponent, MapControlWrapper } from '@/components/map/map-component';
import { RoutePlanner } from '@/components/map/route-planner';
import { CommentSubmissionForm } from '@/components/forms/comment-submission-form';
import { PublicCommentViewer } from '@/components/comments/public-comment-viewer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getObstructions as fetchObstructions, getComments as fetchComments } from '@/lib/actions';
import type { Obstruction, GeoCoordinates, Comment } from '@/lib/types';
import { MessageSquarePlus, Loader2 } from 'lucide-react';
import { ControlPosition } from '@vis.gl/react-google-maps';
import { useToast } from '@/hooks/use-toast';

const TACNA_CENTER: GeoCoordinates = { lat: -18.0146, lng: -70.2534 };
const HEADER_HEIGHT = '4rem'; // approx height of AppHeader (h-16)
const PAGE_VERTICAL_PADDING = '2rem'; // sum of p-4 top and bottom for the main content area
const SIDEBAR_TOP_OFFSET = `calc(${HEADER_HEIGHT} + 1rem)`; // Header + 1rem top padding of parent
const CONTENT_EFFECTIVE_MAX_HEIGHT = `calc(100vh - ${HEADER_HEIGHT} - ${PAGE_VERTICAL_PADDING})`;


export default function HomePage() {
  const [obstructions, setObstructions] = useState<Obstruction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentRoute, setCurrentRoute] = useState<google.maps.DirectionsResult | null>(null);
  const [isLoadingObstructions, setIsLoadingObstructions] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadObstructions() {
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
    }
    loadObstructions();
  }, [toast]);

  useEffect(() => {
    async function loadComments() {
      try {
        setIsLoadingComments(true);
        const fetchedComments = await fetchComments();
        setComments(fetchedComments.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())); // Sort newest first
      } catch (error) {
        console.error("Failed to load comments:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load user comments.' });
      } finally {
        setIsLoadingComments(false);
      }
    }
    loadComments();
  }, [toast]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow flex flex-col">
        {/* Top part: Sidebar and Map */}
        <div className="flex-grow flex flex-col lg:flex-row p-4 gap-4">
          {/* Sidebar Area */}
          <aside className="lg:w-1/3 xl:w-1/4 space-y-4 order-last lg:order-first 
                           lg:sticky lg:top-[var(--sidebar-top-offset)] 
                           h-full lg:max-h-[var(--content-max-height)]
                           lg:overflow-y-auto rounded-lg shadow-lg border bg-card p-4"
                  style={{ '--sidebar-top-offset': SIDEBAR_TOP_OFFSET, '--content-max-height': CONTENT_EFFECTIVE_MAX_HEIGHT } as React.CSSProperties}
          >
            <RoutePlanner onRouteCalculated={setCurrentRoute} obstructions={obstructions} />
          </aside>

          {/* Map Area */}
          <section className="lg:w-2/3 xl:w-3/4 order-first lg:order-last 
                              h-[60vh] lg:h-[var(--content-max-height)]
                              rounded-lg shadow-lg border overflow-hidden"
                     style={{ '--content-max-height': CONTENT_EFFECTIVE_MAX_HEIGHT } as React.CSSProperties}
          >
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
                {/* Report Issue button remains a map control */}
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
          </section>
        </div>

        {/* Comments Section below map and sidebar */}
        <section className="p-4 border-t mt-auto bg-background">
          <div className="container mx-auto">
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
