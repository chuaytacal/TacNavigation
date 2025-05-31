
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import type { Obstruction, ObstructionType, GeoCoordinates, AddObstructionData } from '@/lib/types';
import { PlusCircle, Trash2, MapPin, Edit3, Loader2, MinusCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const obstructionTypes: ObstructionType[] = ['construction', 'closure', 'event', 'accident', 'other'];

// Schema for the form itself
const obstructionFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100),
  description: z.string().min(10, "Description must be at least 10 characters.").max(500),
  type: z.enum(obstructionTypes, { required_error: "Please select an obstruction type." }),
});

type ObstructionFormValues = z.infer<typeof obstructionFormSchema>;

interface ObstructionEditorProps {
  currentObstructions: Obstruction[];
  onObstructionAdded: (data: AddObstructionData) => void; // Changed to pass AddObstructionData
  onObstructionRemoved: (id: string) => void;
  selectedCoordsForNewObstruction: GeoCoordinates | null; // This is the START point
  selectedEndCoordsForNewObstruction?: GeoCoordinates | null; // Optional END point for segments
  clearSelectedCoords: () => void;
  isCreatingSegment: boolean; // To adjust dialog behavior/title
}

export function ObstructionEditor({
  currentObstructions,
  onObstructionAdded,
  onObstructionRemoved,
  selectedCoordsForNewObstruction,
  selectedEndCoordsForNewObstruction,
  clearSelectedCoords,
  isCreatingSegment,
}: ObstructionEditorProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const form = useForm<ObstructionFormValues>({
    resolver: zodResolver(obstructionFormSchema),
    defaultValues: { title: '', description: '', type: undefined },
  });

  // Effect to open dialog when start coordinates are selected
  // and optionally when end coordinates for a segment are also selected.
  useEffect(() => {
    if (selectedCoordsForNewObstruction) {
      setIsDialogOpen(true);
      // If it's a segment and both points are now selected, default type to 'closure'
      if (selectedEndCoordsForNewObstruction) {
        form.reset({ type: 'closure', title: '', description: '' }); // Reset form with type closure
      } else if (!isCreatingSegment) { // If it's a point obstruction (not in segment creation mode)
         form.reset({ title: '', description: '', type: undefined }); // Reset for point
      }
      // if isCreatingSegment is true but no selectedEndCoords, form is reset by user action or previous flow.
    } else {
      setIsDialogOpen(false); // Close if no start coord
    }
  }, [selectedCoordsForNewObstruction, selectedEndCoordsForNewObstruction, form, isCreatingSegment]);

  // Reset form and clear all coords when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      form.reset({ title: '', description: '', type: undefined });
      // clearSelectedCoords(); // This is called by admin/page.tsx on successful add or cancel
    }
  }, [isDialogOpen, form]);


  const onSubmit: SubmitHandler<ObstructionFormValues> = async (data) => {
    if (!selectedCoordsForNewObstruction) {
      toast({ variant: "destructive", title: "Error", description: "No start coordinates selected on the map." });
      return;
    }
    // For 'closure' type, end coordinates are mandatory if it's intended as a segment.
    // The parent component (admin/page.tsx) controls if selectedEndCoordsForNewObstruction is set.
    if (data.type === 'closure' && isCreatingSegment && !selectedEndCoordsForNewObstruction) {
       toast({ variant: "destructive", title: "Error", description: "For a 'closure' segment, please select an end point on the map." });
       return;
    }

    setIsSubmitting(true);
    try {
      const obstructionPayload: AddObstructionData = {
        ...data,
        coordinates: selectedCoordsForNewObstruction,
        endCoordinates: data.type === 'closure' && selectedEndCoordsForNewObstruction ? selectedEndCoordsForNewObstruction : undefined,
      };
      onObstructionAdded(obstructionPayload); // Parent handles the actual API call
      // Toast is handled by parent onObstructionAdded
      setIsDialogOpen(false); // Close dialog on success
      clearSelectedCoords(); // Signal parent to clear coords
    } catch (error) { // Should not happen if parent handles API, but as a fallback
      toast({ variant: "destructive", title: "Failed to add obstruction", description: String(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveObstruction = async (id: string, title: string) => {
    // Confirmation can be added here or in parent
    onObstructionRemoved(id); // Parent handles API and toast
  };
  
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    clearSelectedCoords(); // Ensure coords are cleared when dialog is manually closed
  }

  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <Edit3 className="mr-2 h-6 w-6 text-primary" /> Administrar Obstrucciones
        </CardTitle>
        <CardDescription>
          {isCreatingSegment && !selectedEndCoordsForNewObstruction 
            ? "Segment Started. Details will be filled after selecting end point." 
            : "Define details for the selected point or segment. View existing below."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!selectedCoordsForNewObstruction && !isCreatingSegment && (
          <p className="text-sm text-muted-foreground text-center py-2 px-4 border border-dashed rounded-md">
            <MapPin className="inline-block mr-2 h-4 w-4 align-text-bottom" />
            Click en el mapa para marcar una nueva obstrucción puntual o inicie la creación de un segmento.
          </p>
        )}

        <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open) handleDialogClose(); else setIsDialogOpen(true); }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {selectedEndCoordsForNewObstruction ? "Añadir Segmento de Obstrucción" : "Añadir Obstrucción Puntual"}
              </DialogTitle>
              <DialogDescription>
                Proporcione detalles. Inicio: {selectedCoordsForNewObstruction?.lat.toFixed(4)}, {selectedCoordsForNewObstruction?.lng.toFixed(4)}.
                {selectedEndCoordsForNewObstruction && ` Fin: ${selectedEndCoordsForNewObstruction.lat.toFixed(4)}, ${selectedEndCoordsForNewObstruction.lng.toFixed(4)}`}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl><Input placeholder="e.g., Obras en Calle Principal" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl><Textarea placeholder="Describa brevemente la obstrucción." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value} // ensure value is controlled
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccione tipo" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {obstructionTypes.map(type => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                     {field.value === 'closure' && !selectedEndCoordsForNewObstruction && isCreatingSegment && (
                        <FormDescription className="text-accent">
                            Para 'Cierre de vía' como segmento, asegúrese de haber seleccionado un punto final en el mapa.
                        </FormDescription>
                    )}
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />} 
                    {selectedEndCoordsForNewObstruction ? "Añadir Segmento" : "Añadir Obstrucción"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <h3 className="text-lg font-semibold mt-6 mb-3 font-headline">Obstrucciones Actuales ({currentObstructions.length})</h3>
        {currentObstructions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay obstrucciones marcadas.</p>
        ) : (
          <ScrollArea className="h-[250px] pr-3">
            <ul className="space-y-3">
              {currentObstructions.map(obs => (
                <li key={obs.id} className="p-3 border rounded-md bg-card flex justify-between items-start hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{obs.title}</p>
                    <p className="text-xs text-muted-foreground capitalize flex items-center">
                      {obs.type === 'closure' && obs.endCoordinates ? 
                        <MinusCircle className="h-3 w-3 mr-1 text-destructive" /> : 
                        <MapPin className="h-3 w-3 mr-1 text-primary" />}
                      {obs.type} - Añadido: {new Date(obs.addedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {obs.endCoordinates ? 
                        `Segmento: De (${obs.coordinates.lat.toFixed(3)}, ${obs.coordinates.lng.toFixed(3)}) a (${obs.endCoordinates.lat.toFixed(3)}, ${obs.endCoordinates.lng.toFixed(3)})` 
                        : `Ubicación: ${obs.coordinates.lat.toFixed(3)}, ${obs.coordinates.lng.toFixed(3)}`}
                    </p>
                     <p className="text-xs text-muted-foreground mt-0.5 italic">{obs.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveObstruction(obs.id, obs.title)} aria-label={`Eliminar ${obs.title}`} className="ml-2 shrink-0">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
