import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import SignOutButton from "./SignOutButton";
import NavClient from "./NavClient";

const links = [
  { href: "/", label: "Home" },
  { href: "/pick-team", label: "Pick Team" },
  { href: "/leagues", label: "Leagues" },
  { href: "/transfers", label: "Transfers" },
  { href: "/rules", label: "Rules" },
];

export default async function Nav() {
  const user = await getCurrentUser();

  return (
    <nav className="flex gap-6 items-center p-4 border-b">
      {links.map((l) => (
        <NavClient key={l.href} href={l.href} label={l.label} />
      ))}
      <div className="ml-auto flex gap-4 items-center">
        {user ? (
          <>
            <span className="text-sm text-gray-500">
              {user.firstName || user.email}
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

