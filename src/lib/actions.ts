'use server';

import type { Obstruction, Comment, ObstructionType, GeoCoordinates, CommentFormData } from './types';
import { initialObstructions, initialComments } from './mock-data';

// Simulate a database. In a real app, use a proper database.
let obstructionsStore: Obstruction[] = [...initialObstructions];
let commentsStore: Comment[] = [...initialComments];

export async function getObstructions(): Promise<Obstruction[]> {
  return JSON.parse(JSON.stringify(obstructionsStore)); // Return a copy
}

export interface AddObstructionData {
  coordinates: GeoCoordinates;
  type: ObstructionType;
  title: string;
  description: string;
}

export async function addObstructionAction(data: AddObstructionData): Promise<Obstruction> {
  const newObstruction: Obstruction = {
    ...data,
    id: `obs-${Date.now().toString()}-${Math.random().toString(36).substring(7)}`,
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
