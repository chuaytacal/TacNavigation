
'use client';

import { Map, AdvancedMarker, Pin, InfoWindow, useMap, MapControl, ControlPosition } from '@vis.gl/react-google-maps';
// Polyline import removed as it's causing issues. We'll draw it manually.
import type { GeoCoordinates, Obstruction } from '@/lib/types';
import React, { useState, useEffect, useCallback } from 'react';
import { Construction, TrafficCone, CalendarX2, AlertTriangle, X, MapPin, Minus } from 'lucide-react'; // Added Minus for segment points
import { Button } from '@/components/ui/button';

interface MapComponentProps {
  initialCenter: GeoCoordinates;
  initialZoom: number;
  obstructionsToDisplay?: Obstruction[];
  routeToDisplay?: google.maps.DirectionsResult | null;
  onMapClick?: (coords: GeoCoordinates) => void;
  enableTrafficLayer?: boolean;
  interactive?: boolean;
  children?: React.ReactNode;
}

const obstructionIcons: Record<Obstruction['type'], React.ReactNode> = {
  construction: <Construction className="h-5 w-5 text-yellow-600" />,
  closure: <TrafficCone className="h-5 w-5 text-red-600" />,
  event: <CalendarX2 className="h-5 w-5 text-blue-600" />,
  accident: <AlertTriangle className="h-5 w-5 text-orange-600" />,
  other: <MapPin className="h-5 w-5 text-gray-600" />,
};

const obstructionPinColors: Record<Obstruction['type'], { background: string; glyphColor: string; borderColor: string }> = {
  construction: { background: '#FBBF24', glyphColor: '#000000', borderColor: '#D97706' },
  closure: { background: '#EF4444', glyphColor: '#FFFFFF', borderColor: '#B91C1C' },
  event: { background: '#3B82F6', glyphColor: '#FFFFFF', borderColor: '#1D4ED8' },
  accident: { background: '#F97316', glyphColor: '#FFFFFF', borderColor: '#C2410C' },
  other: { background: '#6B7280', glyphColor: '#FFFFFF', borderColor: '#4B5563' },
};

// Helper component to draw polylines natively using Google Maps API
const NativeObstructionPolyline: React.FC<{
  path: google.maps.LatLngLiteral[];
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  onClick?: () => void;
}> = ({ path, strokeColor, strokeOpacity, strokeWeight, onClick }) => {
  const map = useMap();
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create new polyline instance
    const newPolyline = new google.maps.Polyline({
      path,
      strokeColor,
      strokeOpacity,
      strokeWeight,
      map, // Add to map
    });

    if (onClick) {
      newPolyline.addListener('click', onClick);
    }

    setPolyline(newPolyline);

    // Cleanup on unmount or if props change causing re-render
    return () => {
      newPolyline.setMap(null);
    };
  // Re-create polyline if map or path/style props change
  }, [map, path, strokeColor, strokeOpacity, strokeWeight, onClick]);

  return null; // This component does not render any React DOM elements itself
};


function RoutePolylineDisplay({ route }: { route: google.maps.DirectionsResult }) {
  const mapInstance = useMap();
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!mapInstance) return;
    if (!directionsRenderer) {
      const renderer = new google.maps.DirectionsRenderer({
         polylineOptions: {
          strokeColor: '#FF8A65',
          strokeWeight: 5,
          strokeOpacity: 0.8,
        },
      });
      renderer.setMap(mapInstance);
      setDirectionsRenderer(renderer);
    }

    return () => {
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
    };
  }, [mapInstance, directionsRenderer]);

  useEffect(() => {
    if (directionsRenderer && route) {
      directionsRenderer.setDirections(route);
    } else if (directionsRenderer) {
      // Clear route if `route` is null
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
  const mapInstance = useMap(); // Get map instance for NativeObstructionPolyline

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (onMapClick && event.latLng && interactive) {
      onMapClick({ lat: event.latLng.lat(), lng: event.latLng.lng() });
    }
  }, [onMapClick, interactive]);

  useEffect(() => {
    if (mapInstance && enableTrafficLayer) {
      const trafficLayer = new google.maps.TrafficLayer();
      trafficLayer.setMap(mapInstance);
      return () => {
        if (trafficLayer) {
          trafficLayer.setMap(null);
        }
      };
    }
  }, [mapInstance, enableTrafficLayer]);

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
        disableDefaultUI={!interactive}
      >
        {obstructionsToDisplay.map((obstruction) => {
          if (obstruction.type === 'closure' && obstruction.endCoordinates) {
            return (
              <React.Fragment key={obstruction.id}>
                <NativeObstructionPolyline
                  path={[obstruction.coordinates, obstruction.endCoordinates]}
                  strokeColor="#EF4444" // Red for closure
                  strokeOpacity={0.8}
                  strokeWeight={6}
                  onClick={() => setSelectedObstruction(obstruction)}
                />
                <AdvancedMarker position={obstruction.coordinates} onClick={() => setSelectedObstruction(obstruction)} title={obstruction.title + " (Inicio)"}>
                   <Pin scale={0.6} background={"#B91C1C"} glyphColor={"#FFFFFF"} borderColor={"#7F1D1D"}><Minus /></Pin>
                </AdvancedMarker>
                 <AdvancedMarker position={obstruction.endCoordinates} onClick={() => setSelectedObstruction(obstruction)} title={obstruction.title + " (Fin)"}>
                   <Pin scale={0.6} background={"#B91C1C"} glyphColor={"#FFFFFF"} borderColor={"#7F1D1D"}><Minus /></Pin>
                </AdvancedMarker>
              </React.Fragment>
            );
          }
          return (
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
          );
        })}

        {selectedObstruction && (
          <InfoWindow
            position={selectedObstruction.endCoordinates ?
              { // For segments, position InfoWindow in the middle.
                lat: (selectedObstruction.coordinates.lat + selectedObstruction.endCoordinates.lat) / 2,
                lng: (selectedObstruction.coordinates.lng + selectedObstruction.endCoordinates.lng) / 2
              } :
              selectedObstruction.coordinates // For points, position at the point.
            }
            onCloseClick={() => setSelectedObstruction(null)}
            // Adjust pixelOffset for segments vs points if needed, default for InfoWindow usually handles this.
            pixelOffset={selectedObstruction.endCoordinates ? new google.maps.Size(0, -10) : new google.maps.Size(0, -40)}
          >
            <div className="p-2 max-w-xs">
              <h3 className="text-md font-semibold mb-1 font-headline">{selectedObstruction.title}</h3>
              <p className="text-sm text-muted-foreground mb-1">{selectedObstruction.description}</p>
              <p className="text-xs text-muted-foreground">Tipo: {selectedObstruction.type}</p>
              <p className="text-xs text-muted-foreground">Agregado: {new Date(selectedObstruction.addedAt).toLocaleDateString()}</p>
              {selectedObstruction.endCoordinates && (
                 <p className="text-xs text-muted-foreground">Segmento: ({selectedObstruction.coordinates.lat.toFixed(4)}, {selectedObstruction.coordinates.lng.toFixed(4)}) a ({selectedObstruction.endCoordinates.lat.toFixed(4)}, {selectedObstruction.endCoordinates.lng.toFixed(4)})</p>
              )}
            </div>
          </InfoWindow>
        )}

        {routeToDisplay && <RoutePolylineDisplay route={routeToDisplay} />}
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
