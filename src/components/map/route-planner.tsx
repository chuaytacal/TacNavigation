
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Route, Search, Loader2, Pin, MapPinned } from 'lucide-react';
import type { Obstruction, GeoCoordinates } from '@/lib/types';

interface RoutePlannerProps {
  onRouteCalculated: (route: google.maps.DirectionsResult | null) => void;
  obstructions?: Obstruction[];
  origin: string;
  destination: string;
  onOriginChange: (origin: string) => void;
  onDestinationChange: (destination: string) => void;
  onPickLocation: (type: 'origin' | 'destination') => void;
}

export function RoutePlanner({
  onRouteCalculated,
  obstructions = [],
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onPickLocation,
}: RoutePlannerProps) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const placesLibrary = useMapsLibrary('places');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const originInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const originAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Initialize Directions Service
  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
  }, [routesLibrary, map]);

  // Initialize Autocomplete
  useEffect(() => {
    if (!placesLibrary || !map) return;

    const tacnaBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(-18.08, -70.30), // Southwest
      new google.maps.LatLng(-17.95, -70.15)  // Northeast
    );

    if (originInputRef.current && !originAutocompleteRef.current) {
      const autocomplete = new placesLibrary.Autocomplete(originInputRef.current, {
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: 'PE' },
        bounds: tacnaBounds,
        strictBounds: false, // Allow searching outside bounds a bit
      });
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          onOriginChange(place.formatted_address);
        } else if (place.name) {
          onOriginChange(place.name);
        }
      });
      originAutocompleteRef.current = autocomplete;
    }

    if (destinationInputRef.current && !destinationAutocompleteRef.current) {
      const autocomplete = new placesLibrary.Autocomplete(destinationInputRef.current, {
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: 'PE' },
        bounds: tacnaBounds,
        strictBounds: false,
      });
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          onDestinationChange(place.formatted_address);
        } else if (place.name) {
          onDestinationChange(place.name);
        }
      });
      destinationAutocompleteRef.current = autocomplete;
    }

    // Cleanup
    return () => {
        if (originAutocompleteRef.current) {
            google.maps.event.clearInstanceListeners(originAutocompleteRef.current);
        }
        if (destinationAutocompleteRef.current) {
            google.maps.event.clearInstanceListeners(destinationAutocompleteRef.current);
        }
    };
  }, [placesLibrary, map, onOriginChange, onDestinationChange]);


  // Update input values if changed from parent (e.g., map click)
  useEffect(() => {
    if (originInputRef.current && originInputRef.current.value !== origin) {
      originInputRef.current.value = origin;
    }
  }, [origin]);

  useEffect(() => {
    if (destinationInputRef.current && destinationInputRef.current.value !== destination) {
      destinationInputRef.current.value = destination;
    }
  }, [destination]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directionsService || !map) {
      toast({ title: "Map not ready", description: "Please wait for the map to load.", variant: "destructive" });
      return;
    }
    if (!origin || !destination) {
      toast({ title: "Missing fields", description: "Please enter both origin and destination.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    onRouteCalculated(null); 

    const request: google.maps.DirectionsRequest = {
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: true, 
      drivingOptions: {
        departureTime: new Date(), 
        trafficModel: google.maps.TrafficModel.BEST_GUESS,
      }
    };

    directionsService.route(request, (result, status) => {
      setIsLoading(false);
      if (status === google.maps.DirectionsStatus.OK && result) {
        onRouteCalculated(result);
        toast({ title: "Route calculated", description: "Showing the best route considering traffic." });
        if (result.routes[0] && result.routes[0].bounds) {
            map.fitBounds(result.routes[0].bounds);
        }
      } else {
        console.error('Directions request failed due to ' + status);
        toast({ title: "Route calculation failed", description: `Could not find a route. Status: ${status}`, variant: "destructive" });
        onRouteCalculated(null);
      }
    });
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center"><Route className="mr-2 h-6 w-6 text-primary" /> Plan Your Route</CardTitle>
        <CardDescription>Find the best route considering current traffic and reported obstructions.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="origin">Origin</Label>
            <div className="flex gap-2">
              <Input
                id="origin"
                ref={originInputRef}
                type="text"
                defaultValue={origin} // Use defaultValue for uncontrolled synchronized from parent
                onChange={(e) => onOriginChange(e.target.value)} // Still allow typing
                placeholder="e.g., Plaza de Armas, Tacna"
                required
                className="flex-grow"
              />
              <Button type="button" variant="outline" size="icon" onClick={() => onPickLocation('origin')} aria-label="Pick origin on map">
                <MapPinned className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="destination">Destination</Label>
            <div className="flex gap-2">
              <Input
                id="destination"
                ref={destinationInputRef}
                type="text"
                defaultValue={destination}
                onChange={(e) => onDestinationChange(e.target.value)}
                placeholder="e.g., Mercado Central, Tacna"
                required
                className="flex-grow"
              />
              <Button type="button" variant="outline" size="icon" onClick={() => onPickLocation('destination')} aria-label="Pick destination on map">
                 <MapPinned className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {obstructions.length > 0 && (
            <div className="text-sm text-muted-foreground p-2 border border-dashed rounded-md">
              <div className="flex items-center font-medium mb-1">
                <Pin className="h-4 w-4 mr-2 text-primary" />
                <span>{obstructions.length} active obstruction(s) reported.</span>
              </div>
               <p className="text-xs">Routes will attempt to avoid these if possible, or plan accordingly.</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading || !directionsService}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Find Route
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

    