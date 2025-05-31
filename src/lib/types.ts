export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export type ObstructionType = 'construction' | 'closure' | 'event' | 'accident' | 'other';

export interface Obstruction {
  id: string;
  coordinates: GeoCoordinates;
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

export type RouteStatus = 'open' | 'blocked';

export interface Route {
  id: string;
  name: string;
  pathDescription: string; // e.g., "Plaza de Armas - Mercado Central - Hospital Regional"
  status: RouteStatus;
  // Potentially add waypoints or a polyline string for map display later
}
