"use client";

import { useState } from "react";
import { AuthDebug } from "@/src/components/auth/AuthDebug";
import { signInWithEmail } from "@/src/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
      <h1>Login</h1>

      <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          style={{ display: "block", width: "100%", marginBottom: "0.75rem" }}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Sending…" : "Send login link"}
        </button>
      </form>

      {success && (
        <p style={{ marginTop: "1rem", color: "green" }}>
          Check your email for the login link.
        </p>
      )}

      {error && (
        <p style={{ marginTop: "1rem", color: "red" }} role="alert">
          {error}
        </p>
      )}

      <AuthDebug />
    </div>
  );
}
