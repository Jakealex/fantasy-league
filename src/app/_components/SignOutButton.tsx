"use client";

import { useTransition } from "react";
import { signOutAction } from "./actions";

export default function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await signOutAction();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        disabled={isPending}
        className="text-gray-600 hover:text-black disabled:opacity-50"
      >
        {isPending ? "Signing out..." : "Sign Out"}
      </button>
    </form>
  );
}

