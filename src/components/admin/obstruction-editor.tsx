'use client';

import { useState } from 'react';
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
import { addObstructionAction, removeObstructionAction } from '@/lib/actions';
import type { Obstruction, ObstructionType, GeoCoordinates } from '@/lib/types';
import { PlusCircle, Trash2, MapPin, Edit3, Loader2, Eye, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const obstructionTypes: ObstructionType[] = ['construction', 'closure', 'event', 'accident', 'other'];

const obstructionFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100),
  description: z.string().min(10, "Description must be at least 10 characters.").max(500),
  type: z.enum(obstructionTypes, { required_error: "Please select an obstruction type." }),
});

type ObstructionFormValues = z.infer<typeof obstructionFormSchema>;

interface ObstructionEditorProps {
  currentObstructions: Obstruction[];
  onObstructionAdded: (obstruction: Obstruction) => void;
  onObstructionRemoved: (id: string) => void;
  selectedCoordsForNewObstruction: GeoCoordinates | null;
  clearSelectedCoords: () => void;
}

export function ObstructionEditor({
  currentObstructions,
  onObstructionAdded,
  onObstructionRemoved,
  selectedCoordsForNewObstruction,
  clearSelectedCoords,
}: ObstructionEditorProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const form = useForm<ObstructionFormValues>({
    resolver: zodResolver(obstructionFormSchema),
    defaultValues: { title: '', description: '', type: undefined },
  });

  // Effect to open dialog when coordinates are selected
  useState(() => {
    if (selectedCoordsForNewObstruction) {
      setIsDialogOpen(true);
    }
  });
  // Reset form and clear coords when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      form.reset();
      clearSelectedCoords();
    } else if(selectedCoordsForNewObstruction) {
      form.reset(); // Clear previous form data when opening with new coords
    }
  }, [isDialogOpen, form, clearSelectedCoords, selectedCoordsForNewObstruction]);


  const onSubmit: SubmitHandler<ObstructionFormValues> = async (data) => {
    if (!selectedCoordsForNewObstruction) {
      toast({ variant: "destructive", title: "Error", description: "No coordinates selected on the map." });
      return;
    }
    setIsSubmitting(true);
    try {
      const newObstruction = await addObstructionAction({ ...data, coordinates: selectedCoordsForNewObstruction });
      onObstructionAdded(newObstruction);
      toast({ title: "Obstruction Added", description: `"${data.title}" has been marked on the map.` });
      setIsDialogOpen(false); // Close dialog on success
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to add obstruction", description: String(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveObstruction = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove the obstruction: "${title}"?`)) return;
    try {
      await removeObstructionAction(id);
      onObstructionRemoved(id);
      toast({ title: "Obstruction Removed", description: `"${title}" has been removed from the map.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to remove obstruction", description: String(error) });
    }
  };

  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <Edit3 className="mr-2 h-6 w-6 text-primary" /> Manage Road Obstructions
        </CardTitle>
        <CardDescription>Click on the map to select a location, then add obstruction details. View and remove existing obstructions below.</CardDescription>
      </CardHeader>
      <CardContent>
        {selectedCoordsForNewObstruction && !isDialogOpen && (
           <Button onClick={() => setIsDialogOpen(true)} className="w-full mb-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Obstruction at Selected Point
          </Button>
        )}
        {!selectedCoordsForNewObstruction && (
          <p className="text-sm text-muted-foreground text-center py-2 px-4 border border-dashed rounded-md">
            <MapPin className="inline-block mr-2 h-4 w-4 align-text-bottom" />
            Click on the map to mark a new obstruction location.
          </p>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Obstruction</DialogTitle>
              <DialogDescription>
                Provide details for the obstruction at {selectedCoordsForNewObstruction?.lat.toFixed(5)}, {selectedCoordsForNewObstruction?.lng.toFixed(5)}.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input placeholder="e.g., Roadworks on Main St" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="Briefly describe the obstruction and impact." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select obstruction type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {obstructionTypes.map(type => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />} Add Obstruction
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <h3 className="text-lg font-semibold mt-6 mb-2 font-headline">Current Obstructions ({currentObstructions.length})</h3>
        {currentObstructions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No obstructions currently marked.</p>
        ) : (
          <ScrollArea className="h-[200px] pr-3">
            <ul className="space-y-3">
              {currentObstructions.map(obs => (
                <li key={obs.id} className="p-3 border rounded-md bg-card flex justify-between items-center hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-semibold text-sm">{obs.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{obs.type} - Added: {new Date(obs.addedAt).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">Location: {obs.coordinates.lat.toFixed(4)}, {obs.coordinates.lng.toFixed(4)}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveObstruction(obs.id, obs.title)} aria-label={`Remove ${obs.title}`}>
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
