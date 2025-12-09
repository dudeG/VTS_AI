export interface TutorialStep {
  id: string;
  originalFrame: string; // Base64
  sketchedImage: string | null; // Base64
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

export type Language = 'en' | 'zh';

// Global declaration for the Google AI Studio key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}
