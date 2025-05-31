import type { Obstruction, Comment } from './types';

export const initialObstructions: Obstruction[] = [
  {
    id: 'obs1',
    coordinates: { lat: -18.006, lng: -70.248 },
    type: 'construction',
    title: 'Roadworks on Av. Bolognesi',
    description: 'Major road construction on Avenida Bolognesi near the central market. Expect delays.',
    addedAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
  },
  {
    id: 'obs2',
    coordinates: { lat: -18.014, lng: -70.253 },
    type: 'closure',
    title: 'Street Fair Closure',
    description: 'Calle San Martin closed for a local festival until Sunday evening.',
    addedAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
  },
];

export const initialComments: Comment[] = [
  {
    id: 'com1',
    text: 'Heavy traffic jam near Plaza de Armas due to an unannounced parade.',
    submittedAt: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
    coordinates: { lat: -18.0146, lng: -70.2534 }
  },
  {
    id: 'com2',
    text: 'Accident on Av. Leguia, blocking one lane. Police on site.',
    // imageUrl: 'https://placehold.co/300x200.png', // Example placeholder
    submittedAt: new Date(Date.now() - 3600000 * 1).toISOString(), // 1 hour ago
    coordinates: { lat: -18.020, lng: -70.250 }
  },
];
