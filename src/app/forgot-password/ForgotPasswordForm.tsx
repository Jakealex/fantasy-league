"use client";

import { useState, useTransition } from "react";
import { forgotPasswordAction } from "./actions";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setResetToken("");

    startTransition(async () => {
      try {
        const result = await forgotPasswordAction(email);
        if (result?.ok) {
          setSuccess(true);
          setResetToken(result.token || "");
        } else {
          setError(result?.error || "Failed to send reset link");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send reset link");
      }
    });
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          <p className="font-semibold">Reset link generated!</p>
          <p className="mt-1">
            Your reset token is: <code className="font-mono bg-white px-2 py-1 rounded">{resetToken}</code>
          </p>
          <p className="mt-2">
            Click the link below to reset your password:
          </p>
          <Link
            href={`/reset-password?token=${resetToken}`}
            className="text-blue-600 hover:text-blue-800 underline block mt-2"
          >
            Reset Password
          </Link>
        </div>
        <Link
          href="/login"
          className="block text-center text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Back to login
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
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-black focus:outline-none"
          disabled={isPending}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-black px-4 py-2 text-white font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Sending..." : "Send Reset Link"}
      </button>

      <div className="text-center text-sm text-gray-600">
        Remember your password?{" "}
        <Link href="/login" className="text-blue-600 hover:text-blue-800 underline">
          Sign in
        </Link>
      </div>
    </form>
  );
}

