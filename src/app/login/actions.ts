"use server";

import { signIn } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth";

export async function loginAction(form: { email: string; password: string }) {
  // Check if already logged in
  const user = await getCurrentUser();
  if (user) {
    return { ok: true };
  }

  const result = await signIn(form.email, form.password);
  return result;
}

