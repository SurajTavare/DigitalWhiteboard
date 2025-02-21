// Get the base URL for the current environment
export function getBaseUrl(): string {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return '';
    }
  
    // First, check for Vercel environment variables
    if (import.meta.env.VITE_VERCEL_URL) {
      return `https://${import.meta.env.VITE_VERCEL_URL}`;
    }
  
    // For preview deployments and local development
    return window.location.origin.replace(/\/$/, '');
  }