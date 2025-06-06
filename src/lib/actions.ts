
'use server';

import type { Obstruction, Comment, ObstructionType, GeoCoordinates, CommentFormData, Route, RouteStatus, AddObstructionData } from './types';
import { initialObstructions, initialComments, initialRoutes } from './mock-data';

// Simulate a database. In a real app, use a proper database.
let obstructionsStore: Obstruction[] = [...initialObstructions];
let commentsStore: Comment[] = [...initialComments];
let routesStore: Route[] = [...initialRoutes];

export async function getObstructions(): Promise<Obstruction[]> {
  return JSON.parse(JSON.stringify(obstructionsStore)); // Return a copy
}

export async function addObstructionAction(data: AddObstructionData): Promise<Obstruction> {
  const newObstruction: Obstruction = {
    id: `obs-${Date.now().toString()}-${Math.random().toString(36).substring(7)}`,
    coordinates: data.coordinates,
    endCoordinates: data.endCoordinates, // Save endCoordinates if provided
    type: data.type,
    title: data.title,
    description: data.description,
    addedAt: new Date().toISOString(),
  };
  obstructionsStore.push(newObstruction);
  return JSON.parse(JSON.stringify(newObstruction));
}

export async function removeObstructionAction(id: string): Promise<{ success: boolean }> {
  const initialLength = obstructionsStore.length;
  obstructionsStore = obstructionsStore.filter(obs => obs.id !== id);
  return { success: obstructionsStore.length < initialLength };
}

export async function getComments(): Promise<Comment[]> {
  return JSON.parse(JSON.stringify(commentsStore)); // Return a copy
}

export async function submitCommentAction(formData: CommentFormData): Promise<Comment> {
  // In a real app, handle file upload properly, e.g., to cloud storage
  // For now, we'll ignore the image file content
  const newComment: Comment = {
    id: `comment-${Date.now().toString()}-${Math.random().toString(36).substring(7)}`,
    text: formData.text,
    imageUrl: formData.image ? `https://placehold.co/300x200.png?text=${formData.image.name.substring(0,10)}` : undefined, // Placeholder for image
    submittedAt: new Date().toISOString(),
    coordinates: (formData.latitude && formData.longitude) ? { lat: formData.latitude, lng: formData.longitude } : undefined,
  };
  commentsStore.unshift(newComment); // Add to the beginning of the list
  return JSON.parse(JSON.stringify(newComment));
}

// Actions for Routes
export async function getRoutes(): Promise<Route[]> {
  return JSON.parse(JSON.stringify(routesStore)); // Return a copy
}

export async function toggleRouteStatusAction(routeId: string): Promise<Route | null> {
  const routeIndex = routesStore.findIndex(route => route.id === routeId);
  if (routeIndex > -1) {
    routesStore[routeIndex].status = routesStore[routeIndex].status === 'open' ? 'blocked' : 'open';
    return JSON.parse(JSON.stringify(routesStore[routeIndex]));
  }
  return null;
}
