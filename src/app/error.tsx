'use client';
import React from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[60vh] grid place-items-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-gray-600">Please try again.</p>
        <button
          onClick={() => reset()}
          className="mt-4 rounded-lg border px-4 py-2"
        >
          Reload page
        </button>
      </div>
    </main>
  );
}

