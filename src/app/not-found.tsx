import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] grid place-items-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-gray-600">These are not the pages you seek.</p>
        <Link href="/" className="mt-4 inline-block underline">
          Go back home
        </Link>
      </div>
    </main>
  );
}
