
'use client';

import { Map, AdvancedMarker, Pin, InfoWindow, useMap, MapControl, ControlPosition } from '@vis.gl/react-google-maps';
import type { GeoCoordinates, Obstruction } from '@/lib/types';
import React, { useState, useEffect, useCallback } from 'react';
import { Construction, TrafficCone, CalendarX2, AlertTriangle, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapComponentProps {
  initialCenter: GeoCoordinates;
  initialZoom: number;
  obstructionsToDisplay?: Obstruction[];
  routeToDisplay?: google.maps.DirectionsResult | null;
  onMapClick?: (coords: GeoCoordinates) => void;
  enableTrafficLayer?: boolean;
  selectedObstructionForRoute?: Obstruction | null;
  interactive?: boolean; // for admin map
  children?: React.ReactNode; // To allow passing controls like MapControlWrapper
}

const obstructionIcons: Record<Obstruction['type'], React.ReactNode> = {
  construction: <Construction className="h-5 w-5 text-yellow-600" />,
  closure: <TrafficCone className="h-5 w-5 text-red-600" />,
  event: <CalendarX2 className="h-5 w-5 text-blue-600" />,
  accident: <AlertTriangle className="h-5 w-5 text-orange-600" />,
  other: <MapPin className="h-5 w-5 text-gray-600" />,
};

const obstructionPinColors: Record<Obstruction['type'], { background: string; glyphColor: string; borderColor: string }> = {
  construction: { background: '#FBBF24', glyphColor: '#000000', borderColor: '#D97706' }, // Amber
  closure: { background: '#EF4444', glyphColor: '#FFFFFF', borderColor: '#B91C1C' }, // Red
  event: { background: '#3B82F6', glyphColor: '#FFFFFF', borderColor: '#1D4ED8' }, // Blue
  accident: { background: '#F97316', glyphColor: '#FFFFFF', borderColor: '#C2410C' }, // Orange
  other: { background: '#6B7280', glyphColor: '#FFFFFF', borderColor: '#4B5563' }, // Gray
};

function RoutePolyline({ route }: { route: google.maps.DirectionsResult }) {
  const map = useMap();
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!map) return;
    if (!directionsRenderer) {
      // Suppress default markers (A, B) if you want to add custom ones later
      // Or let it draw default markers. For now, default markers are fine.
      const renderer = new google.maps.DirectionsRenderer({
         polylineOptions: {
          strokeColor: '#FF8A65', // Example: Orange accent color
          strokeWeight: 5,
          strokeOpacity: 0.8,
        },
        // suppressMarkers: true, // Uncomment if you add custom start/end markers
      });
      renderer.setMap(map);
      setDirectionsRenderer(renderer);
    }
    
    return () => {
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
    };
  }, [map, directionsRenderer]);

  useEffect(() => {
    if (directionsRenderer && route) {
      directionsRenderer.setDirections(route);
    } else if (directionsRenderer) {
      // Clear route if route prop is null
      directionsRenderer.setDirections(undefined); 
    }
  }, [route, directionsRenderer]);

  return null;
}

export function MapComponent({
  initialCenter,
  initialZoom,
  obstructionsToDisplay = [],
  routeToDisplay,
  onMapClick,
  enableTrafficLayer = false,
  interactive = true,
  children,
}: MapComponentProps) {
  const [selectedObstruction, setSelectedObstruction] = useState<Obstruction | null>(null);
  const map = useMap(); // Get map instance for traffic layer

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (onMapClick && event.latLng && interactive) {
      onMapClick({ lat: event.latLng.lat(), lng: event.latLng.lng() });
    }
  }, [onMapClick, interactive]);
  
  useEffect(() => {
    if (map && enableTrafficLayer) {
      const trafficLayer = new google.maps.TrafficLayer();
      trafficLayer.setMap(map);
      return () => {
        if (trafficLayer) {
          trafficLayer.setMap(null);
        }
      };
    }
  }, [map, enableTrafficLayer]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-lg border">
      <Map
        defaultCenter={initialCenter}
        defaultZoom={initialZoom}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "TACNA_TRANSIT_FLOW_MAP_ID"}
        gestureHandling={interactive ? "auto" : "none"}
        zoomControl={interactive}
        streetViewControl={interactive}
        mapTypeControl={interactive}
        fullscreenControl={interactive}
        onClick={handleMapClick}
        className="w-full h-full"
        // Performance: disable default UI when not interactive or to simplify
        disableDefaultUI={!interactive}
      >
        {obstructionsToDisplay.map((obstruction) => (
          <AdvancedMarker
            key={obstruction.id}
            position={obstruction.coordinates}
            onClick={() => setSelectedObstruction(obstruction)}
            title={obstruction.title}
          >
            <Pin 
              background={obstructionPinColors[obstruction.type].background}
              glyphColor={obstructionPinColors[obstruction.type].glyphColor}
              borderColor={obstructionPinColors[obstruction.type].borderColor}
            >
              {obstructionIcons[obstruction.type]}
            </Pin>
          </AdvancedMarker>
        ))}

        {selectedObstruction && (
          <InfoWindow
            position={selectedObstruction.coordinates}
            onCloseClick={() => setSelectedObstruction(null)}
            pixelOffset={new google.maps.Size(0, -40)} // Adjust based on Pin size
          >
            <div className="p-2 max-w-xs">
              <h3 className="text-md font-semibold mb-1 font-headline">{selectedObstruction.title}</h3>
              <p className="text-sm text-muted-foreground mb-1">{selectedObstruction.description}</p>
              <p className="text-xs text-muted-foreground">Type: {selectedObstruction.type}</p>
              <p className="text-xs text-muted-foreground">Added: {new Date(selectedObstruction.addedAt).toLocaleDateString()}</p>
            </div>
          </InfoWindow>
        )}
        
        {routeToDisplay && <RoutePolyline route={routeToDisplay} />}
        {children}
      </Map>
    </div>
  );
}

export function MapControlWrapper({ children, position = ControlPosition.TOP_LEFT }: { children: React.ReactNode, position?: ControlPosition }) {
  return (
    <MapControl position={position}>
      <div className="m-2 p-2 bg-background rounded-md shadow-lg border">
        {children}
      </div>
    </MapControl>
  );
}

