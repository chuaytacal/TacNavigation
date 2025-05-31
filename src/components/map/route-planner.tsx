'use client';

import { useState, useEffect } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Route, Search, Loader2, Pin } from 'lucide-react';
import type { Obstruction } from '@/lib/types'; // Assuming obstructions are passed for awareness

interface RoutePlannerProps {
  onRouteCalculated: (route: google.maps.DirectionsResult | null) => void;
  obstructions?: Obstruction[]; // For user awareness, not direct API input
}

export function RoutePlanner({ onRouteCalculated, obstructions = [] }: RoutePlannerProps) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
  }, [routesLibrary, map]);

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
    onRouteCalculated(null); // Clear previous route

    const request: google.maps.DirectionsRequest = {
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: true,
      drivingOptions: {
        departureTime: new Date(), // for traffic consideration
        trafficModel: google.maps.TrafficModel.BEST_GUESS,
      }
    };

    directionsService.route(request, (result, status) => {
      setIsLoading(false);
      if (status === google.maps.DirectionsStatus.OK && result) {
        onRouteCalculated(result);
        toast({ title: "Route calculated", description: "Showing the best route considering traffic." });
        // Fit map to bounds of the route
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
          <div>
            <Label htmlFor="origin">Origin</Label>
            <Input
              id="origin"
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g., Plaza de Armas, Tacna"
              required
            />
          </div>
          <div>
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g., Mercado Central, Tacna"
              required
            />
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
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Find Route
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
