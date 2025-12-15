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
  
  // Get user with error handling - don't crash if database is unreachable
  let user = null;
  try {
    user = await getCurrentUser();
  } catch (error) {
    // Log error but don't crash the page
    console.error('[NAV] Error getting user (database may be unreachable):', error);
    // Continue with null user (shows login/signup links)
  }

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

