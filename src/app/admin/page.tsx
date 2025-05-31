'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { MapComponent, MapControlWrapper } from '@/components/map/map-component';
import { ObstructionEditor } from '@/components/admin/obstruction-editor';
import { CommentViewer } from '@/components/admin/comment-viewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getObstructions as fetchObstructions, getComments as fetchComments } from '@/lib/actions';
import type { Obstruction, Comment, GeoCoordinates } from '@/lib/types';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ControlPosition } from '@vis.gl/react-google-maps';


const TACNA_CENTER: GeoCoordinates = { lat: -18.0146, lng: -70.2534 };

export default function AdminPage() {
  const [obstructions, setObstructions] = useState<Obstruction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState({ obstructions: true, comments: true });
  const [selectedCoords, setSelectedCoords] = useState<GeoCoordinates | null>(null);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, obstructions: true, comments: true }));
      const [fetchedObstructions, fetchedComments] = await Promise.all([
        fetchObstructions(),
        fetchComments()
      ]);
      setObstructions(fetchedObstructions);
      setComments(fetchedComments.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())); // Sort newest first
    } catch (error) {
      console.error("Failed to load admin data:", error);
      toast({ variant: 'destructive', title: 'Error Loading Data', description: 'Could not fetch admin data. Please try again.' });
    } finally {
      setIsLoading(prev => ({ ...prev, obstructions: false, comments: false }));
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMapClick = useCallback((coords: GeoCoordinates) => {
    setSelectedCoords(coords);
    toast({ title: "Location Selected", description: `Coordinates ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)} ready for new obstruction.`});
  }, [toast]);

  const handleObstructionAdded = (newObstruction: Obstruction) => {
    setObstructions(prev => [...prev, newObstruction]);
    setSelectedCoords(null); // Clear selection after adding
  };

  const handleObstructionRemoved = (id: string) => {
    setObstructions(prev => prev.filter(obs => obs.id !== id));
  };
  
  const clearSelectedCoords = useCallback(() => {
    setSelectedCoords(null);
  }, []);

  if (isLoading.obstructions || isLoading.comments) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Loading Admin Panel...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow relative flex flex-col lg:flex-row">
        <div className="lg:w-3/5 h-[50vh] lg:h-[calc(100vh-4rem)] border-b lg:border-b-0 lg:border-r">
           <Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-muted"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <p className="ml-4 text-lg">Loading Map...</p></div>}>
            <MapComponent
              initialCenter={TACNA_CENTER}
              initialZoom={14}
              obstructionsToDisplay={obstructions}
              onMapClick={handleMapClick}
              enableTrafficLayer={true}
              interactive={true}
            />
          </Suspense>
        </div>
        <div className="lg:w-2/5 h-[50vh] lg:h-[calc(100vh-4rem)] overflow-y-auto p-1 sm:p-2 md:p-4">
          <Tabs defaultValue="obstructions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="obstructions">Manage Obstructions</TabsTrigger>
              <TabsTrigger value="comments">View Comments</TabsTrigger>
            </TabsList>
            <TabsContent value="obstructions">
              <ObstructionEditor
                currentObstructions={obstructions}
                onObstructionAdded={handleObstructionAdded}
                onObstructionRemoved={handleObstructionRemoved}
                selectedCoordsForNewObstruction={selectedCoords}
                clearSelectedCoords={clearSelectedCoords}
              />
            </TabsContent>
            <TabsContent value="comments">
              <CommentViewer comments={comments} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
