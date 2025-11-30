"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavClient({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={
        isActive
          ? "font-semibold underline"
          : "text-gray-600 hover:text-black"
      }
    >
      {label}
    </Link>
  );
}

