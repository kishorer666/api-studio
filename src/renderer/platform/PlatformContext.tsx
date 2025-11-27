import React, { createContext, useContext } from 'react';
import { platformAdapter, PlatformAdapter } from './PlatformAdapter';

const PlatformContext = createContext<PlatformAdapter>(platformAdapter);

export const PlatformProvider: React.FC<{ adapter?: PlatformAdapter; children: React.ReactNode }> = ({ adapter, children }) => {
  return (
    <PlatformContext.Provider value={adapter || platformAdapter}>
      {children}
    </PlatformContext.Provider>
  );
};

export function usePlatform(): PlatformAdapter {
  return useContext(PlatformContext);
}

// Convenience hook for storage access
export function useStorage() {
  return usePlatform().storage();
}
