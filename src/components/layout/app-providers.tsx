'use client';

import type { ReactNode } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">Configuration Error</h1>
        <p className="text-lg">
          Google Maps API Key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Refer to .env.local.example for an example.
        </p>
      </div>
    );
  }
  
  return (
    <APIProvider apiKey={apiKey} solutionChannel="GMP_devsite_samples_v3_rgma_solution_TacnaTransit">
      {children}
    </APIProvider>
  );
}
