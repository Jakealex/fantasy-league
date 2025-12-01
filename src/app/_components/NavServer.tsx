import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import SignOutButton from "./SignOutButton";
import NavClient from "./NavClient";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = 'force-dynamic';

const links = [
  { href: "/", label: "Home" },
  { href: "/pick-team", label: "Pick Team" },
  { href: "/leagues", label: "Leagues" },
  { href: "/transfers", label: "Transfers" },
  { href: "/rules", label: "Rules" },
];

export default async function Nav() {
  noStore(); // Prevent any caching
  
  // Force execution - log immediately
  const timestamp = new Date().toISOString();
  console.error('[NAV-DEBUG] Component executing at:', timestamp);
  console.log('[NAV-DEBUG] Component executing at:', timestamp);
  
  const user = await getCurrentUser();
  
  // Debug logging for Vercel logs - use both console.log and console.error
  const userInfo = user ? { id: user.id, email: user.email, firstName: user.firstName } : 'null';
  console.error('[NAV-DEBUG] User:', userInfo);
  console.log('[NAV-DEBUG] User:', userInfo);
  console.error('[NAV-DEBUG] Will render:', user ? 'LOGGED IN' : 'LOGGED OUT');
  console.log('[NAV-DEBUG] Will render:', user ? 'LOGGED IN' : 'LOGGED OUT');

  return (
    <nav className="flex gap-6 items-center p-4 border-b">
      {links.map((l) => (
        <NavClient key={l.href} href={l.href} label={l.label} />
      ))}
      <div className="ml-auto flex gap-4 items-center">
        {/* Debug: Show user state */}
        {process.env.NODE_ENV === 'development' && (
          <span className="text-xs text-red-500" title={`User: ${user ? 'EXISTS' : 'NULL'}`}>
            [DEBUG]
          </span>
        )}
        {user ? (
          <>
            <span className="text-sm text-gray-500">
              {user.firstName || user.email || "User"}
            </span>
            <SignOutButton />
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-gray-600 hover:text-black"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-gray-600 hover:text-black"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

