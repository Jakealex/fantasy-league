"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOutAction } from "./actions";

export default function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOutAction();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isPending}
      className="text-gray-600 hover:text-black disabled:opacity-50"
    >
      {isPending ? "Signing out..." : "Sign Out"}
    </button>
  );
}

