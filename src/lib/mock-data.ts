
import type { Obstruction, Comment, Route } from './types';

export const initialObstructions: Obstruction[] = [
  {
    id: 'obs1',
    coordinates: { lat: -18.006, lng: -70.248 }, // Point obstruction
    type: 'construction',
    title: 'Roadworks on Av. Bolognesi',
    description: 'Major road construction on Avenida Bolognesi near the central market. Expect delays.',
    addedAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
  },
  {
    id: 'obs2',
    coordinates: { lat: -18.014, lng: -70.253 }, // Start of segment
    endCoordinates: { lat: -18.0135, lng: -70.252 }, // End of segment
    type: 'closure',
    title: 'Street Fair Closure on San Martin',
    description: 'Calle San Martin closed for a local festival between indicated points until Sunday evening.',
    addedAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
  },
  {
    id: 'obs3',
    coordinates: { lat: -18.010, lng: -70.250 }, // Point obstruction
    type: 'accident',
    title: 'Minor Accident',
    description: 'Minor accident at the intersection, causing slight delays.',
    addedAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
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

export const initialRoutes: Route[] = [
  {
    id: 'R001',
    name: 'Ruta A - Expreso Centro',
    pathDescription: 'Plaza de Armas - Av. Bolognesi - Mercado Central - Ovalo Cusco',
    status: 'open',
  },
  {
    id: 'R002',
    name: 'Ruta B - Circunvalación',
    pathDescription: 'Terminal Terrestre - Av. Leguia - Hospital Regional - Cono Sur',
    status: 'congested',
  },
  {
    id: 'R003',
    name: 'Ruta C - Norte Directo',
    pathDescription: 'Ciudad Nueva - Av. Internacional - Aeropuerto - Alto de la Alianza',
    status: 'blocked',
  },
  {
    id: 'R004',
    name: 'Ruta D - Playas',
    pathDescription: 'Centro - Boca del Río (Solo Verano)',
    status: 'open',
  },
  {
    id: 'R005',
    name: 'Ruta E - Alimentadora Oeste',
    pathDescription: 'Para Chico - Av. Collpa - Gregorio Albarracín',
    status: 'congested',
  },
];
