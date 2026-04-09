'use client';

import { useEffect } from 'react';

/**
 * Global error handler to catch and suppress AbortErrors from Turbopack hot reload and Supabase
 * This prevents AbortErrors from appearing as runtime errors in the browser
 */
export default function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections (AbortErrors)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      
      // Check if it's an AbortError - be very aggressive in catching these
      const isAbortError = 
        reason?.name === 'AbortError' ||
        reason?.name === 'DOMException' && reason?.code === 20 ||
        reason?.message?.includes('aborted') ||
        reason?.message?.includes('signal is aborted') ||
        reason?.message?.includes('abort') ||
        reason?.code === '20' ||
        reason?.code === 20 ||
        (typeof reason === 'string' && reason.includes('aborted')) ||
        (reason?.stack && reason.stack.includes('aborted')) ||
        (reason?.toString && reason.toString().includes('aborted'));
      
      if (isAbortError) {
        event.preventDefault();
        event.stopPropagation();
        // Silently ignore - this is expected during hot reload/unmount
        return;
      }
    };

    // Handle runtime errors (AbortErrors that slip through)
    const handleError = (event: ErrorEvent) => {
      const error = event.error;
      
      // Check if it's an AbortError - be very aggressive
      const isAbortError = 
        error?.name === 'AbortError' ||
        error?.name === 'DOMException' && error?.code === 20 ||
        error?.message?.includes('aborted') ||
        error?.message?.includes('signal is aborted') ||
        error?.message?.includes('abort') ||
        error?.code === '20' ||
        error?.code === 20 ||
        (error?.stack && error.stack.includes('aborted')) ||
        (error?.toString && error.toString().includes('aborted'));
      
      if (isAbortError) {
        event.preventDefault();
        event.stopPropagation();
        // Silently ignore - this is expected during hot reload/unmount
        return false;
      }
    };

    // Set up listeners with capture phase to catch errors early
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);
    window.addEventListener('error', handleError, true);

    // Also set up on window object directly for maximum coverage
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      // Filter out AbortError messages from console
      const hasAbortError = args.some(arg => 
        (typeof arg === 'string' && (arg.includes('AbortError') || arg.includes('aborted'))) ||
        (arg?.name === 'AbortError') ||
        (arg?.message?.includes('aborted'))
      );
      
      if (!hasAbortError) {
        originalConsoleError.apply(console, args);
      }
    };

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
      window.removeEventListener('error', handleError, true);
      console.error = originalConsoleError;
    };
  }, []);

  return null; // This component doesn't render anything
}
