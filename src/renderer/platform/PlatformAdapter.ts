export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface PlatformAdapter {
  target: 'desktop' | 'web';
  isDesktop(): boolean;
  isWeb(): boolean;
  storage(): StorageLike;
}

// Factory selection based on build-time env FLAG injected by webpack DefinePlugin
export function createPlatformAdapter(): PlatformAdapter {
  const target = (process.env.TARGET as 'desktop' | 'web') || 'desktop';
  if (target === 'web') {
    return new WebAdapter();
  }
  return new ElectronAdapter();
}

class ElectronAdapter implements PlatformAdapter {
  target: 'desktop' = 'desktop';
  isDesktop() { return true; }
  isWeb() { return false; }
  storage(): StorageLike { return window.localStorage; }
}

class WebAdapter implements PlatformAdapter {
  target: 'web' = 'web';
  isDesktop() { return false; }
  isWeb() { return true; }
  storage(): StorageLike { return window.localStorage; }
}

// Convenience singleton (optional future replacement by Context Provider)
export const platformAdapter: PlatformAdapter = createPlatformAdapter();