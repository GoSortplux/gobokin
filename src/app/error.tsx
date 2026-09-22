'use client';

import { useEffect } from 'react';

const isChunkLoadError = (error: Error & { digest?: string }) => {
  if (!error) return false;
  const message = (error.message || '').toLowerCase();
  const name = (error.name || '').toLowerCase();

  return (
    name.includes('chunkloaderror') ||
    message.includes('loading chunk') ||
    message.includes('chunkloaderror') ||
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('css_chunk_load_failed') ||
    message.includes('unexpected token')
  );
};

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError = isChunkLoadError(error);

  useEffect(() => {
    // Log the error
    console.error('Unhandled error caught by boundary:', error);

    // Auto-recover from chunk load errors caused by deployments or stale assets
    if (isChunkError) {
      try {
        const lastReload = sessionStorage.getItem('last-chunk-reload');
        const now = Date.now();
        // Prevent infinite reload loops: auto-reload at most once every 10 seconds
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem('last-chunk-reload', now.toString());
          window.location.reload();
        }
      } catch (e) {
        window.location.reload();
      }
    }
  }, [error, isChunkError]);

  const handleAction = () => {
    if (isChunkError) {
      // For chunk/asset loading failures, reset() won't help; force a hard refresh
      window.location.reload();
    } else {
      reset();
    }
  };

  const handleHardReset = () => {
    // Force a full page reload to clear any stale state/assets
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              ></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isChunkError ? 'Update Available' : 'Something went wrong'}
          </h2>
          <p className="text-gray-600 mb-8">
            {isChunkError
              ? 'A recent update or network change occurred. Please refresh the page to load the latest version.'
              : 'We encountered an unexpected error. This might be due to a recent update.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={handleAction}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              {isChunkError ? 'Refresh Page' : 'Try again'}
            </button>
            {!isChunkError && (
              <button
                onClick={handleHardReset}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Refresh page
              </button>
            )}
          </div>
        </div>
        <p className="mt-6 text-sm text-gray-400">
          If the problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
