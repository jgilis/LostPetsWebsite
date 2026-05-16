"use client";

import { useState } from "react";
import { signInWithEmail } from "@/src/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasEmail = email.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    const { error: signInError } = await signInWithEmail(email);

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-gray-800 bg-gray-900/90 p-8 shadow-xl">
          <h1 className="mb-8 text-3xl font-bold tracking-tight text-white">
            Login
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="login-email"
                className="mb-1 block text-sm font-medium text-gray-200"
              >
                Email address
              </label>
              <p className="mb-3 text-sm text-gray-400">
                We&apos;ll send you a magic link to sign in
              </p>
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-2.5 text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !hasEmail}
              className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                hasEmail
                  ? "bg-blue-600 text-white hover:bg-blue-500"
                  : "cursor-not-allowed bg-gray-600 text-gray-300"
              }`}
            >
              {loading ? "Sending…" : "Send login link"}
            </button>
          </form>

          {success && (
            <p className="mt-6 text-sm text-green-400" role="status">
              Check your email for the login link.
            </p>
          )}

          {error && (
            <p className="mt-6 text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
