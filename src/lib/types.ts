
export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export type ObstructionType = 'construction' | 'closure' | 'event' | 'accident' | 'other';

export interface Obstruction {
  id: string;
  coordinates: GeoCoordinates; // Start point for a segment, or the point for a point-obstruction
  endCoordinates?: GeoCoordinates; // End point if it's a segment obstruction
  type: ObstructionType;
  description: string;
  title: string;
  addedAt: string; // ISO date string
}

export interface Comment {
  id: string;
  text: string;
  imageUrl?: string;
  submittedAt: string; // ISO date string
  coordinates?: GeoCoordinates; // Optional: if comment is location-specific
}

export interface CommentFormData {
  text: string;
  image?: File;
  latitude?: number;
  longitude?: number;
}

export type RouteStatus = 'open' | 'blocked' | 'congested';

export interface Route {
  id: string;
  name: string;
  pathDescription: string; // e.g., "Plaza de Armas - Mercado Central - Hospital Regional"
  status: RouteStatus;
  // Potentially add waypoints or a polyline string for map display later
}

// Updated to include optional endCoordinates
export interface AddObstructionData {
  coordinates: GeoCoordinates;
  endCoordinates?: GeoCoordinates;
  type: ObstructionType;
  title: string;
  description: string;
}
