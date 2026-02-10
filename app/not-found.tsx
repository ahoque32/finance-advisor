import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-xl font-bold mb-2">Page Not Found</h2>
        <p className="text-zinc-400 text-sm mb-6">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl text-sm font-medium transition-colors inline-block"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
