"use client";

import { useState } from "react";
import type { AuthError } from "@supabase/supabase-js";
import { signInWithEmail } from "@/src/lib/auth";
import { useTranslation } from "@/src/i18n/I18nProvider";
import type { TranslationKey } from "@/src/i18n/types";

function formatMagicLinkError(
  error: AuthError,
  t: (key: TranslationKey) => string,
): string {
  const message = error.message.toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  const isRateLimit =
    error.status === 429 ||
    code === "over_email_send_rate_limit" ||
    code.includes("rate_limit") ||
    message.includes("rate limit") ||
    message.includes("email rate limit") ||
    message.includes("over_email_send") ||
    (message.includes("retry") && message.includes("limit"));

  if (isRateLimit) {
    return t("loginRateLimit");
  }

  return error.message;
}

export default function LoginPage() {
  const { t } = useTranslation();
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
      setError(formatMagicLinkError(signInError, t));
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-gray-800 bg-gray-900/90 p-8 shadow-xl">
          <h1 className="mb-8 text-3xl font-bold tracking-tight text-white">
            {t("loginTitle")}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <p className="mb-3 text-sm text-gray-400">{t("loginIntro")}</p>
              <label
                htmlFor="login-email"
                className="mb-1 block text-sm font-medium text-gray-200"
              >
                {t("loginEmailLabel")}
              </label>
              <input
                id="login-email"
                type="email"
                placeholder={t("loginEmailPlaceholder")}
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
              {loading ? t("loginSending") : t("loginSendLink")}
            </button>
          </form>

          {success && (
            <p className="mt-6 text-sm text-green-400" role="status">
              {t("loginCheckEmail")}
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
