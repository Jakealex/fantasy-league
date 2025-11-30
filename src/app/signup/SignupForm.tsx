"use client";

import { useState, useTransition } from "react";
import { signupAction } from "./actions";
import Link from "next/link";

const SHEVATIM = [
  "Ktan tanim",
  "Gurim",
  "Roim",
  "Moledet",
  "Chaim",
  "Reim",
  "Kaveh",
];

export default function SignupForm() {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    shevet: "",
    role: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function updateField(field: string, value: string) {
    setForm({ ...form, [field]: value });
    // Clear field error when user types
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: "" });
    }
  }

  function validateForm() {
    const errors: Record<string, string> = {};

    if (!form.email) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Invalid email format";
    }

    if (!form.password) errors.password = "Password is required";
    else if (form.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!form.firstName) errors.firstName = "First name is required";
    if (!form.lastName) errors.lastName = "Last name is required";
    if (!form.shevet) errors.shevet = "Please select a shevet";
    if (!form.role) errors.role = "Please select Maddie or Channie";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await signupAction({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          shevet: form.shevet,
          role: form.role,
        });

        if (res?.ok) {
          // Force full page reload to ensure session is picked up
          window.location.href = "/";
        } else {
          setError(res?.error || "Signup failed");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Signup failed");
      }
    });
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
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          className={`w-full rounded-lg border px-4 py-2 focus:outline-none ${
            fieldErrors.email
              ? "border-red-300 focus:border-red-500"
              : "border-gray-300 focus:border-black"
          }`}
          disabled={isPending}
        />
        {fieldErrors.email && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
          className={`w-full rounded-lg border px-4 py-2 focus:outline-none ${
            fieldErrors.password
              ? "border-red-300 focus:border-red-500"
              : "border-gray-300 focus:border-black"
          }`}
          disabled={isPending}
          minLength={6}
        />
        {fieldErrors.password && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
        )}
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
          onChange={(e) => updateField("confirmPassword", e.target.value)}
          className={`w-full rounded-lg border px-4 py-2 focus:outline-none ${
            fieldErrors.confirmPassword
              ? "border-red-300 focus:border-red-500"
              : "border-gray-300 focus:border-black"
          }`}
          disabled={isPending}
        />
        {fieldErrors.confirmPassword && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
          First Name
        </label>
        <input
          id="firstName"
          type="text"
          required
          placeholder="John"
          value={form.firstName}
          onChange={(e) => updateField("firstName", e.target.value)}
          className={`w-full rounded-lg border px-4 py-2 focus:outline-none ${
            fieldErrors.firstName
              ? "border-red-300 focus:border-red-500"
              : "border-gray-300 focus:border-black"
          }`}
          disabled={isPending}
        />
        {fieldErrors.firstName && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>
        )}
      </div>

      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
          Last Name
        </label>
        <input
          id="lastName"
          type="text"
          required
          placeholder="Doe"
          value={form.lastName}
          onChange={(e) => updateField("lastName", e.target.value)}
          className={`w-full rounded-lg border px-4 py-2 focus:outline-none ${
            fieldErrors.lastName
              ? "border-red-300 focus:border-red-500"
              : "border-gray-300 focus:border-red-500"
          }`}
          disabled={isPending}
        />
        {fieldErrors.lastName && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>
        )}
      </div>

      <div>
        <label htmlFor="shevet" className="block text-sm font-medium text-gray-700 mb-1">
          Shevet
        </label>
        <select
          id="shevet"
          required
          value={form.shevet}
          onChange={(e) => updateField("shevet", e.target.value)}
          className={`w-full rounded-lg border px-4 py-2 focus:outline-none ${
            fieldErrors.shevet
              ? "border-red-300 focus:border-red-500"
              : "border-gray-300 focus:border-black"
          }`}
          disabled={isPending}
        >
          <option value="">Select Shevet</option>
          {SHEVATIM.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {fieldErrors.shevet && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.shevet}</p>
        )}
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
          Role
        </label>
        <select
          id="role"
          required
          value={form.role}
          onChange={(e) => updateField("role", e.target.value)}
          className={`w-full rounded-lg border px-4 py-2 focus:outline-none ${
            fieldErrors.role
              ? "border-red-300 focus:border-red-500"
              : "border-gray-300 focus:border-black"
          }`}
          disabled={isPending}
        >
          <option value="">Maddie or Channie?</option>
          <option value="Maddie">Maddie</option>
          <option value="Channie">Channie</option>
        </select>
        {fieldErrors.role && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.role}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-black px-4 py-2 text-white font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Creating account..." : "Sign Up"}
      </button>

      <div className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 hover:text-blue-800 underline">
          Sign in
        </Link>
      </div>
    </form>
  );
}

