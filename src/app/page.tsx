import Link from "next/link";

export default function Home() {
  return (
    <main className="p-24">
      <h1 className="text-4xl font-bold">Fantasy League</h1>
      <p className="mt-2 text-lg text-gray-600">...</p>
      <Link href="/about" className="mt-4 text-blue-600 underline">Go to About page</Link>
    </main>
  );
}
