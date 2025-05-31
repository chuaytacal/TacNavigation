
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { MapComponent, MapControlWrapper } from '@/components/map/map-component';
import { ObstructionEditor } from '@/components/admin/obstruction-editor';
import { CommentViewer } from '@/components/admin/comment-viewer';
import { RouteManagementTable } from '@/components/admin/route-management-table';
import { getObstructions as fetchObstructions, getComments as fetchComments, getRoutes, toggleRouteStatusAction, addObstructionAction, removeObstructionAction } from '@/lib/actions';
import type { Obstruction, Comment, Route, GeoCoordinates, AddObstructionData } from '@/lib/types';
import { Loader2, MapPin, AlertCircle, PlusCircle, MinusCircle, Ban, Search, Waypoints } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const TACNA_CENTER: GeoCoordinates = { lat: -18.0146, lng: -70.2534 }; 

type AdminPanelTab = "routes" | "obstructions" | "comments";
type SegmentCreationMode = "idle" | "pickingStart" | "pickingEnd";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminPanelTab>("routes");
  
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);

  const [obstructions, setObstructions] = useState<Obstruction[]>([]);
  const [isLoadingObstructions, setIsLoadingObstructions] = useState(true);
  const [selectedCoordsForNewObstruction, setSelectedCoordsForNewObstruction] = useState<GeoCoordinates | null>(null);
  const [selectedEndCoordsForNewObstruction, setSelectedEndCoordsForNewObstruction] = useState<GeoCoordinates | null>(null);
  const [segmentCreationMode, setSegmentCreationMode] = useState<SegmentCreationMode>("idle");
  const [mapInstruction, setMapInstruction] = useState<string | null>("Click on the map to mark a new point obstruction, or start defining a segment.");

  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  const [startLat, setStartLat] = useState('');
  const [startLng, setStartLng] = useState('');
  const [endLat, setEndLat] = useState('');
  const [endLng, setEndLng] = useState('');
  const [isProcessingCoords, setIsProcessingCoords] = useState(false);

  const { toast } = useToast();

  const loadAllData = useCallback(async () => {
    setIsLoadingRoutes(true);
    setIsLoadingObstructions(true);
    setIsLoadingComments(true);
    try {
      const [fetchedRoutes, fetchedObstructions, fetchedComments] = await Promise.all([
        getRoutes(),
        fetchObstructions(),
        fetchComments()
      ]);
      setRoutes(fetchedRoutes.sort((a, b) => a.id.localeCompare(b.id)));
      setObstructions(fetchedObstructions.sort((a,b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()));
      setComments(fetchedComments.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
    } catch (error) {
      console.error("Failed to load admin data:", error);
      toast({ variant: 'destructive', title: 'Error al Cargar Datos', description: 'No se pudieron obtener los datos para el panel. Intente de nuevo.' });
    } finally {
      setIsLoadingRoutes(false);
      setIsLoadingObstructions(false);
      setIsLoadingComments(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleToggleRouteStatus = async (routeId: string) => {
    const originalRoutes = [...routes];
    setRoutes(prev => prev.map(r => r.id === routeId ? { ...r, status: r.status === 'open' ? 'blocked' : 'open' } : r));
    try {
      const updatedRoute = await toggleRouteStatusAction(routeId);
      if (!updatedRoute) throw new Error("Failed to update route on server.");
      toast({ title: 'Estado de Ruta Actualizado', description: `La ruta "${updatedRoute.name}" ahora está ${updatedRoute.status === 'open' ? 'abierta' : 'bloqueada'}.` });
       await loadAllData(); 
    } catch (error) {
      setRoutes(originalRoutes);
      toast({ variant: 'destructive', title: 'Error al Actualizar Ruta', description: String(error) });
    }
  };

  const handleMapClick = (coords: GeoCoordinates) => {
    if (activeTab !== 'obstructions') return;

    if (segmentCreationMode === "pickingStart") {
      setSelectedCoordsForNewObstruction(coords);
      setSegmentCreationMode("pickingEnd");
      setMapInstruction("Segment Start selected. Click map again to select End point for the blockage.");
    } else if (segmentCreationMode === "pickingEnd") {
      setSelectedEndCoordsForNewObstruction(coords);
      setSegmentCreationMode("idle"); 
      setMapInstruction("Segment End selected. Fill obstruction details below.");
      // ObstructionEditor dialog will open via its own useEffect now that both points are set
    } else { 
      setSelectedCoordsForNewObstruction(coords);
      setSelectedEndCoordsForNewObstruction(null); 
      setSegmentCreationMode("idle"); 
      setMapInstruction("Point selected for obstruction. Fill details below.");
    }
  };
  
  const handleStartSegmentCreationByMap = () => {
    setSegmentCreationMode("pickingStart");
    setSelectedCoordsForNewObstruction(null);
    setSelectedEndCoordsForNewObstruction(null);
    setMapInstruction("Click on the map to select the START point of the blocked segment.");
    toast({title: "Define Segment", description: "Click on the map for the START point."});
  };

  const handleDefineSegmentByCoordinates = async () => {
    const sLat = parseFloat(startLat);
    const sLng = parseFloat(startLng);
    const eLat = parseFloat(endLat);
    const eLng = parseFloat(endLng);

    if (isNaN(sLat) || isNaN(sLng) || isNaN(eLat) || isNaN(eLng)) {
      toast({ variant: 'destructive', title: 'Coordenadas Inválidas', description: 'Por favor ingrese números válidos para latitud y longitud.' });
      return;
    }
    // Basic validation for lat/lng ranges
    if (sLat < -90 || sLat > 90 || eLat < -90 || eLat > 90 || sLng < -180 || sLng > 180 || eLng < -180 || eLng > 180) {
        toast({ variant: 'destructive', title: 'Coordenadas Fuera de Rango', description: 'Latitud debe estar entre -90 y 90, Longitud entre -180 y 180.' });
        return;
    }

    setIsProcessingCoords(true);
    clearSelectedObstructionCoords(); // Clear any previous map selections

    setSelectedCoordsForNewObstruction({ lat: sLat, lng: sLng });
    setSelectedEndCoordsForNewObstruction({ lat: eLat, lng: eLng });
    setSegmentCreationMode("idle"); // Ensure editor opens for segment directly
    toast({ title: 'Coordenadas Ingresadas', description: 'Coordenadas listas. Complete los detalles de la obstrucción.' });
    
    // Clear input fields
    setStartLat('');
    setStartLng('');
    setEndLat('');
    setEndLng('');
    setIsProcessingCoords(false);
    // ObstructionEditor dialog will open via its useEffect now
  };


  const handleObstructionAdded = async (obstructionData: AddObstructionData) => {
    try {
      const newObstruction = await addObstructionAction(obstructionData);
      setObstructions(prev => [newObstruction, ...prev].sort((a,b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()));
      toast({ title: 'Obstrucción Añadida', description: `"${newObstruction.title}" ha sido marcada.` });
      clearSelectedObstructionCoords(); 
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al Añadir Obstrucción', description: String(error) });
    }
  };

  const handleObstructionRemoved = async (id: string) => {
    try {
      await removeObstructionAction(id);
      setObstructions(prev => prev.filter(obs => obs.id !== id));
      toast({ title: 'Obstrucción Eliminada' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al Eliminar Obstrucción', description: String(error) });
    }
  };
  
  const clearSelectedObstructionCoords = () => {
    setSelectedCoordsForNewObstruction(null);
    setSelectedEndCoordsForNewObstruction(null);
    setSegmentCreationMode("idle");
    setMapInstruction("Click on the map to mark a new point obstruction, or start defining a segment.");
  };

  if (isLoadingRoutes || isLoadingObstructions || isLoadingComments) {
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
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value as AdminPanelTab);
          if (value !== 'obstructions') {
            clearSelectedObstructionCoords(); 
            setStartLat(''); setStartLng(''); setEndLat(''); setEndLng('');
          } else {
            setMapInstruction("Click on the map to mark a new point obstruction, or start defining a segment by map clicks, or use coordinate input.");
          }
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="routes">Gestión de Rutas</TabsTrigger>
            <TabsTrigger value="obstructions">Gestión de Obstrucciones</TabsTrigger>
            <TabsTrigger value="comments">Comentarios de Usuarios</TabsTrigger>
          </TabsList>

          <TabsContent value="routes">
            <RouteManagementTable 
             routes={routes} 
             onToggleRouteStatus={handleToggleRouteStatus}
             isLoading={isLoadingRoutes}
           />
          </TabsContent>

          <TabsContent value="obstructions">
            <Card>
              <CardHeader>
                <CardTitle>Mapa de Administración de Obstrucciones</CardTitle>
                <CardDescription>
                  {mapInstruction || "Click on the map to mark a new point obstruction, define a segment by map clicks, or use coordinate input below."}
                </CardDescription>
                 {segmentCreationMode !== "idle" && (
                    <Button variant="outline" size="sm" onClick={clearSelectedObstructionCoords} className="mt-2">
                        <Ban className="mr-2 h-4 w-4" /> Cancelar Creación por Mapa
                    </Button>
                )}
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 h-[500px] rounded-lg overflow-hidden shadow-lg border relative">
                  <Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-muted"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                    <MapComponent
                      initialCenter={TACNA_CENTER}
                      initialZoom={13}
                      obstructionsToDisplay={obstructions}
                      onMapClick={handleMapClick}
                      interactive={true} 
                    />
                  </Suspense>
                  {segmentCreationMode === 'pickingStart' && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground p-2 rounded shadow-lg text-sm z-10 pointer-events-none">
                        <MapPin className="inline mr-1 h-4 w-4"/> Seleccione el INICIO del bloqueo.
                    </div>
                  )}
                  {segmentCreationMode === 'pickingEnd' && (
                     <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground p-2 rounded shadow-lg text-sm z-10 pointer-events-none">
                        <MapPin className="inline mr-1 h-4 w-4"/> Seleccione el FIN del bloqueo.
                    </div>
                  )}
                </div>
                <div className="md:col-span-1 space-y-4">
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-2">Definir Segmento por Mapa</h3>
                     <Button 
                        onClick={handleStartSegmentCreationByMap} 
                        className="w-full" 
                        variant="outline"
                        disabled={segmentCreationMode !== "idle"}
                      >
                        <MinusCircle className="mr-2 h-4 w-4" /> Empezar Creación por Mapa
                      </Button>
                  </Card>
                  
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-3">Definir Segmento por Coordenadas</h3>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="startLat">Latitud Inicio</Label>
                        <Input 
                          id="startLat" 
                          type="number"
                          step="any"
                          placeholder="Ej: -18.0146" 
                          value={startLat} 
                          onChange={(e) => setStartLat(e.target.value)} 
                          disabled={isProcessingCoords}
                        />
                      </div>
                       <div>
                        <Label htmlFor="startLng">Longitud Inicio</Label>
                        <Input 
                          id="startLng" 
                          type="number"
                          step="any"
                          placeholder="Ej: -70.2534" 
                          value={startLng} 
                          onChange={(e) => setStartLng(e.target.value)} 
                          disabled={isProcessingCoords}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endLat">Latitud Fin</Label>
                        <Input 
                          id="endLat" 
                          type="number"
                          step="any"
                          placeholder="Ej: -18.0135" 
                          value={endLat} 
                          onChange={(e) => setEndLat(e.target.value)} 
                          disabled={isProcessingCoords}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endLng">Longitud Fin</Label>
                        <Input 
                          id="endLng" 
                          type="number"
                          step="any"
                          placeholder="Ej: -70.2520" 
                          value={endLng} 
                          onChange={(e) => setEndLng(e.target.value)} 
                          disabled={isProcessingCoords}
                        />
                      </div>
                       <Button 
                        onClick={handleDefineSegmentByCoordinates} 
                        className="w-full"
                        disabled={isProcessingCoords || !startLat || !startLng || !endLat || !endLng || segmentCreationMode !== 'idle'}
                      >
                        {isProcessingCoords ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Waypoints className="mr-2 h-4 w-4" />}
                        Definir por Coordenadas
                      </Button>
                    </div>
                  </Card>
                 
                  <ObstructionEditor
                    currentObstructions={obstructions}
                    onObstructionAdded={handleObstructionAdded}
                    onObstructionRemoved={handleObstructionRemoved}
                    selectedCoordsForNewObstruction={selectedCoordsForNewObstruction}
                    selectedEndCoordsForNewObstruction={selectedEndCoordsForNewObstruction}
                    clearSelectedCoords={clearSelectedObstructionCoords}
                    isCreatingSegment={segmentCreationMode !== 'idle' || (selectedCoordsForNewObstruction !== null && selectedEndCoordsForNewObstruction !== null)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments">
            <div className="flex justify-center">
              <CommentViewer comments={comments} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

