"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { signInWithEmail } from "@/src/lib/auth";
import { writeAuthReturnPath } from "@/src/lib/authRedirect";
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

function LoginPageContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasEmail = email.trim().length > 0;

  useEffect(() => {
    writeAuthReturnPath(nextPath);
  }, [nextPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    const { error: signInError } = await signInWithEmail(email, nextPath);

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
        <div className="rounded-2xl border border-lp-line bg-lp-paper p-8 shadow-[0_10px_28px_rgb(61_52_44_/_0.08)]">
          <h1 className="mb-8 text-3xl font-bold tracking-tight text-lp-ink">
            {t("loginTitle")}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <p className="mb-3 text-sm text-lp-ink-muted">{t("loginIntro")}</p>
              <label
                htmlFor="login-email"
                className="mb-1 block text-sm font-medium text-lp-ink"
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
                className="w-full rounded-xl border border-lp-line bg-lp-paper-muted px-4 py-2.5 text-lp-ink placeholder:text-lp-ink-subtle focus:border-lp-sage focus:outline-none focus:ring-1 focus:ring-lp-sage disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !hasEmail}
              className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                hasEmail
                  ? "bg-lp-sage text-white hover:bg-lp-sage-dark"
                  : "cursor-not-allowed bg-lp-line text-lp-ink-subtle"
              }`}
            >
              {loading ? t("loginSending") : t("loginSendLink")}
            </button>
          </form>

          {success && (
            <p className="mt-6 text-sm text-lp-teal" role="status">
              {t("loginCheckEmail")}
            </p>
          )}

          {error && (
            <p className="mt-6 text-sm text-lp-coral" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12 text-lp-ink-muted">
          Loading…
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
