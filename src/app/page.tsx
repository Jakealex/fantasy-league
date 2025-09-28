import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Fantasy League</h1>
      <p className="mt-2 text-lg text-gray-600">
        Welcome to a potential camp FPL site Josh Berson and friends 🚀
      </p>
      <Link href="/about" className="mt-4 text-blue-600 underline">
        Go to About page
      </Link>
    </main>
  );
}
