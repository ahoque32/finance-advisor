"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-zinc-400 text-sm mb-6">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
