"use client";

import { useTransition } from "react";
import { signOutAction } from "./actions";

export default function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await signOutAction();
      } catch (error) {
        console.error("Sign out error:", error);
        // Still redirect even if there's an error
        window.location.href = "/login";
      }
    });
  };

  return (
    <form onSubmit={handleSignOut}>
      <button
        type="submit"
        disabled={isPending}
        aria-label="Sign out"
        className="text-gray-600 hover:text-black disabled:opacity-50 transition-colors"
      >
        {isPending ? "Signing out..." : "Sign Out"}
      </button>
    </form>
  );
}

