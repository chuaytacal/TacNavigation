'use client';

import { useState, useEffect, Suspense } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { MapComponent, MapControlWrapper } from '@/components/map/map-component';
import { RoutePlanner } from '@/components/map/route-planner';
import { CommentSubmissionForm } from '@/components/forms/comment-submission-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getObstructions as fetchObstructions } from '@/lib/actions';
import type { Obstruction, GeoCoordinates } from '@/lib/types';
import { MessageSquarePlus, Loader2 } from 'lucide-react';
import { ControlPosition } from '@vis.gl/react-google-maps';

const TACNA_CENTER: GeoCoordinates = { lat: -18.0146, lng: -70.2534 };

export default function HomePage() {
  const [obstructions, setObstructions] = useState<Obstruction[]>([]);
  const [currentRoute, setCurrentRoute] = useState<google.maps.DirectionsResult | null>(null);
  const [isLoadingObstructions, setIsLoadingObstructions] = useState(true);
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);

  useEffect(() => {
    async function loadObstructions() {
      try {
        setIsLoadingObstructions(true);
        const fetchedObstructions = await fetchObstructions();
        setObstructions(fetchedObstructions);
      } catch (error) {
        console.error("Failed to load obstructions:", error);
        // Optionally show a toast error
      } finally {
        setIsLoadingObstructions(false);
      }
    }
    loadObstructions();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow relative flex">
        <div className="flex-grow h-[calc(100vh-4rem)]"> {/* Adjust 4rem based on AppHeader height */}
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-muted"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-4 text-lg">Loading Map...</p></div>}>
            <MapComponent
              initialCenter={TACNA_CENTER}
              initialZoom={14}
              obstructionsToDisplay={obstructions}
              routeToDisplay={currentRoute}
              enableTrafficLayer={true}
              interactive={true}
            >
               <MapControlWrapper position={ControlPosition.TOP_LEFT}>
                <RoutePlanner onRouteCalculated={setCurrentRoute} obstructions={obstructions} />
              </MapControlWrapper>
              
              <MapControlWrapper position={ControlPosition.BOTTOM_RIGHT}>
                 <Dialog open={isCommentFormOpen} onOpenChange={setIsCommentFormOpen}>
                    <DialogTrigger asChild>
                      <Button variant="default" size="lg" className="shadow-xl bg-accent hover:bg-accent/90 text-accent-foreground">
                        <MessageSquarePlus className="mr-2 h-5 w-5" /> Report Issue
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
      </main>
    </div>
  );
}
