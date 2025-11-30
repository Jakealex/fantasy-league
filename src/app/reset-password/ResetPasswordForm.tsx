"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordAction } from "./actions";
import Link from "next/link";

type Props = {
  token?: string;
};

export default function ResetPasswordForm({ token }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    startTransition(async () => {
      try {
        const result = await resetPasswordAction(token, form.password);
        if (result?.ok) {
          router.push("/login?reset=success");
        } else {
          setError(result?.error || "Failed to reset password");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reset password");
      }
    });
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          Invalid or missing reset token. Please request a new password reset.
        </div>
        <Link
          href="/forgot-password"
          className="block text-center text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          New Password
        </label>
        <input
          id="password"
          type="password"
          required
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-black focus:outline-none"
          disabled={isPending}
          minLength={6}
        />
        <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          placeholder="••••••••"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-black focus:outline-none"
          disabled={isPending}
          minLength={6}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-black px-4 py-2 text-white font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Resetting..." : "Reset Password"}
      </button>

      <div className="text-center text-sm text-gray-600">
        <Link href="/login" className="text-blue-600 hover:text-blue-800 underline">
          Back to login
        </Link>
      </div>
    </form>
  );
}

