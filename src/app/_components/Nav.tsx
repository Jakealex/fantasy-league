'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  
  { href: "/", label: "Home" },
  { href: "/pick-team", label: "Pick Team" },
  { href: "/leagues", label: "Leagues" },
  
  { href: "/transfers", label: "Transfers" },
  { href: "/rules", label: "Rules" },
];


export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-6 p-4 border-b">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={
            pathname === l.href
              ? "font-semibold underline"
              : "text-gray-600 hover:text-black"
          }
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

