/* Page: Auth - atelier */
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import BrandMark from "../../../components/shared/BrandMark";
import { useStaffAuth } from "@/context/auth/useAuthRealm";
import { useToast } from "../../../context/ToastContext";
import { isAdminRole, resolveLanding } from "../../../utils/roles";
import { validateCredentials } from "../../../utils/validateCredentials";

export default function AtelierLogin() {
  const { login, loading, booting, isAuthenticated, user } = useStaffAuth();
  const { toast } = useToast();

  const navigate = useNavigate();

  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);

  // Already signed in — send them where they belong rather than asking again.
  // The session rebuilds itself from the refresh cookie on load, so wait for
  // that answer before deciding: bouncing to "already in" while still asking
  // the server would replace a working session with the sign-in form.
  if (!booting && isAuthenticated) {
    return <Navigate to={resolveLanding(user, location.state?.from)} replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();

    const errs = validateCredentials({ email, password });
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setError(null);

    try {
      // The realm is not passed: the staff door is the admin boundary, fixed
      // in the session. A shopper's account fails here with the same 401 as a
      // wrong password, so there is nothing to say about it and no oracle to
      // hand out.
      const { user: signedIn } = await login({ email: email.trim(), password });

      if (isAdminRole(signedIn?.role)) {
        toast(`Welcome back, ${signedIn.name?.split(" ")[0] ?? "there"}.`, "success");
      } else {
        // Genuinely signed in, but holding no dashboard role. Say so plainly —
        // they have already proved who they are.
        toast("That account has no dashboard access. Ask an administrator.", "info");
      }

      // Navigated directly, with no setTimeout: the session update is
      // synchronous, so the delay the previous flow used bought nothing and
      // left an uncancelled timer that fired even after unmount.
      navigate(resolveLanding(signedIn, location.state?.from), { replace: true });
    } catch (err) {
      // A 400 from the API is a field-level complaint; a 401 is the uniform
      // "Invalid email or password." Either way the server's message is the one
      // to show, and it never says which half was wrong.
      const message = err?.message ?? "Sign in failed. Please try again.";
      setError(message);
      toast(message, "error");
    }
  };

  const inputClass =
    "w-full border-b border-ivory-50/25 bg-transparent px-0 py-3 text-sm text-ivory-50 placeholder:text-ivory-50/35 focus:border-gold-500 focus:outline-none transition-colors";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-espresso px-6 py-16">
      <div className="w-full max-w-sm">
        <BrandMark label="Belioras — storefront" wrapperClassName="mx-auto block w-fit" />

        <p className="eyebrow mt-8 text-center">Atelier</p>
        <h1 className="mt-2 text-center font-display text-3xl tracking-wide text-ivory-50">
          Staff sign in
        </h1>

        <form onSubmit={onSubmit} className="mt-10 space-y-6" noValidate>
          <div>
            <label
              htmlFor="atelier-email"
              className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-ivory-50/55"
            >
              Business email
            </label>
            <input
              id="atelier-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "atelier-email-error" : undefined}
              className={inputClass}
            />
            {fieldErrors.email && (
              <p id="atelier-email-error" className="mt-1.5 text-[12px] text-error">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="atelier-password"
              className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-ivory-50/55"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="atelier-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "atelier-password-error" : undefined}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-ivory-50/45 transition-colors hover:text-ivory-50"
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="atelier-password-error" className="mt-1.5 text-[12px] text-error">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="text-[13px] text-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 bg-gold-500 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-espresso transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
            Sign in
          </button>
        </form>

        {/* No sign-up link: staff accounts are created by an administrator,
            never self-registered. */}
        <p className="mt-8 text-center text-[11px] leading-relaxed text-ivory-50/40">
          Access is granted by a Belioras administrator. Shopping instead?{" "}
          <Link to="/login" className="underline underline-offset-4 hover:text-ivory-50/70">
            Client sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
