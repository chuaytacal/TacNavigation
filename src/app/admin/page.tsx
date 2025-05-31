
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { MapComponent, MapControlWrapper } from '@/components/map/map-component';
import { ObstructionEditor } from '@/components/admin/obstruction-editor';
import { CommentViewer } from '@/components/admin/comment-viewer';
import { RouteManagementTable } from '@/components/admin/route-management-table';
import { getObstructions as fetchObstructions, getComments as fetchComments, getRoutes, toggleRouteStatusAction, addObstructionAction, removeObstructionAction } from '@/lib/actions';
import type { Obstruction, Comment, Route, GeoCoordinates, AddObstructionData } from '@/lib/types';
import { Loader2, MapPin, AlertCircle, PlusCircle, MinusCircle, Ban, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

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

  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  const { toast } = useToast();
  const geocodingLibrary = useMapsLibrary('geocoding');
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (geocodingLibrary) {
      setGeocoder(new geocodingLibrary.Geocoder());
    }
  }, [geocodingLibrary]);

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
  
  const handleStartSegmentCreation = () => {
    setSegmentCreationMode("pickingStart");
    setSelectedCoordsForNewObstruction(null);
    setSelectedEndCoordsForNewObstruction(null);
    setMapInstruction("Click on the map to select the START point of the blocked segment.");
    toast({title: "Define Segment", description: "Click on the map for the START point."});
  };

  const handleDefineSegmentByAddress = async () => {
    if (!geocoder) {
      toast({ variant: 'destructive', title: 'Error', description: 'Servicio de geocodificación no está listo.' });
      return;
    }
    if (!startAddress || !endAddress) {
      toast({ variant: 'destructive', title: 'Faltan Direcciones', description: 'Por favor ingrese ambas direcciones de inicio y fin.' });
      return;
    }

    setIsGeocoding(true);
    clearSelectedObstructionCoords(); // Clear any previous map selections

    try {
      const geocodeAddress = async (address: string): Promise<GeoCoordinates | null> => {
        const response = await geocoder.geocode({ address, componentRestrictions: { country: 'PE' } }); // Restrict to Peru for better accuracy
        if (response.results[0] && response.results[0].geometry) {
          const location = response.results[0].geometry.location;
          return { lat: location.lat(), lng: location.lng() };
        }
        return null;
      };

      const [startCoords, endCoords] = await Promise.all([
        geocodeAddress(startAddress + ", Tacna, Peru"), // Add city/country context
        geocodeAddress(endAddress + ", Tacna, Peru")
      ]);

      if (startCoords && endCoords) {
        setSelectedCoordsForNewObstruction(startCoords);
        setSelectedEndCoordsForNewObstruction(endCoords);
        setSegmentCreationMode("idle"); // Ensure editor opens for segment directly
        toast({ title: 'Direcciones Geocodificadas', description: 'Coordenadas obtenidas. Complete los detalles de la obstrucción.' });
        // ObstructionEditor dialog will open via its useEffect now
      } else {
        let errorMsg = '';
        if (!startCoords) errorMsg += 'No se pudo geocodificar la dirección de inicio. ';
        if (!endCoords) errorMsg += 'No se pudo geocodificar la dirección de fin.';
        toast({ variant: 'destructive', title: 'Error de Geocodificación', description: errorMsg.trim() });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast({ variant: 'destructive', title: 'Error de Geocodificación', description: 'Ocurrió un error al procesar las direcciones.' });
    } finally {
      setIsGeocoding(false);
    }
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
            setStartAddress(''); 
            setEndAddress('');
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
                  {mapInstruction || "Click on the map to mark a new point obstruction, or start defining a segment."}
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
                        onClick={handleStartSegmentCreation} 
                        className="w-full" 
                        variant="outline"
                        disabled={segmentCreationMode !== "idle"}
                      >
                        <MinusCircle className="mr-2 h-4 w-4" /> Empezar Creación por Mapa
                      </Button>
                  </Card>
                  
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-3">Definir Segmento por Direcciones</h3>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="startAddress">Dirección de Inicio</Label>
                        <Input 
                          id="startAddress" 
                          placeholder="Ej: Av. Bolognesi 123" 
                          value={startAddress} 
                          onChange={(e) => setStartAddress(e.target.value)} 
                          disabled={isGeocoding}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endAddress">Dirección de Fin</Label>
                        <Input 
                          id="endAddress" 
                          placeholder="Ej: Calle San Martin 456" 
                          value={endAddress} 
                          onChange={(e) => setEndAddress(e.target.value)} 
                          disabled={isGeocoding}
                        />
                      </div>
                       <Button 
                        onClick={handleDefineSegmentByAddress} 
                        className="w-full"
                        disabled={isGeocoding || !startAddress || !endAddress || segmentCreationMode !== 'idle'}
                      >
                        {isGeocoding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Obtener Coordenadas y Definir
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
