/* Page: Auth - atelier set password */
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react";

import BrandMark from "../../../components/shared/BrandMark";
import { useStaffAuth } from "@/context/auth/useAuthRealm";
import { useToast } from "../../../context/ToastContext";
import { resolveLanding } from "../../../utils/roles";
import { validatePassword } from "../../../utils/validatePassword";

/**
 * The API names the two fields it validates; the form needs the ids of the two
 * boxes they belong to. `validatePassword` speaks ids (it writes the messages
 * before a request is made), so this is the one place the two vocabularies meet.
 */
const SERVER_FIELD_TO_INPUT = {
  currentPassword: "set-password-current",
  newPassword: "set-password-new",
  confirmPassword: "set-password-confirm",
};

/**
 * The one screen an account created by an administrator can use, and the only
 * one it is allowed to use until the temporary password it was given has been
 * replaced.
 *
 * It sits at the atelier door rather than inside the dashboard on purpose. The
 * guard that sends an account here lives on every dashboard route, so anything
 * rendered inside the shell would be one navigation away from the shell itself —
 * and a person holding a password that was read aloud should not be one click
 * from the order queue.
 *
 * The two rules the screen enforces are the server's, not this file's: the
 * current password has to be right, and the new one has to differ from it. Both
 * come back as field errors and are shown as they arrive.
 */
export default function AtelierSetPassword() {
  const { changePassword, loading, booting, isAuthenticated, mustChangePassword, user, logout } = useStaffAuth();
  const { toast } = useToast();

  const navigate = useNavigate();
  const location = useLocation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);

  /**
   * Two ways to be somewhere this screen makes no sense: not signed in at all,
   * or signed in with a password they have already chosen.
   *
   * The two are not the same destination. Signed in and already rotated — they
   * finished in another tab, or typed the address by hand — the dashboard is
   * right there, and bouncing them to a sign-in page would be wrong. Not signed
   * in at all, they get the atelier door, because `resolveLanding` on a null user
   * resolves to the shopper's `/account`: the wrong realm entirely, for someone
   * who was never signed in anywhere.
   */
  if (!booting && !isAuthenticated) {
    return <Navigate to="/atelier" replace />;
  }

  if (!booting && !mustChangePassword) {
    return <Navigate to={resolveLanding(user, location.state?.from)} replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();

    const errs = validatePassword({ currentPassword, newPassword, confirmPassword });
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setError(null);

    try {
      await changePassword({ currentPassword, newPassword });

      toast("Password updated.", "success");

      // Onwards to whatever they were trying to reach. The session was never
      // dropped by the rotation, so this is a navigation and not a re-login.
      // `state.from` is absent when they arrived here from the guard with nothing
      // to go back to, and `resolveLanding` covers that.
      navigate(resolveLanding(user, location.state?.from), { replace: true });
    } catch (err) {
      // The server's own words. A wrong current password is a 401, and saying
      // which field was wrong is the whole point of this form — unlike the sign
      // -in form, where the answer must stay uniform.
      //
      // It keys them by API field name; the boxes above are keyed by id. Without
      // this the message arrives, is stored, and then renders nowhere, leaving
      // only the summary at the bottom of the form.
      const fromServer = err?.fieldErrors;
      setFieldErrors(
        Object.fromEntries(
          Object.entries(fromServer ?? {}).map(([key, message]) => [
            SERVER_FIELD_TO_INPUT[key] ?? key,
            message,
          ]),
        ),
      );
      const message = err?.message ?? "Could not update your password. Please try again.";
      setError(message);
      toast(message, "error");
    }
  };

  const inputClass =
    "w-full border-b border-ivory-50/25 bg-transparent px-0 py-3 text-sm text-ivory-50 placeholder:text-ivory-50/35 focus:border-gold-500 focus:outline-none transition-colors";

  const field = (id, label, value, onChange, autoComplete, hint) => (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-ivory-50/55"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(fieldErrors[id])}
          aria-describedby={fieldErrors[id] ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`${inputClass} pr-10`}
        />
        {id === "set-password-current" ? (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide passwords" : "Show passwords"}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-ivory-50/45 transition-colors hover:text-ivory-50"
          >
            {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        ) : null}
      </div>
      {fieldErrors[id] ? (
        <p id={`${id}-error`} className="mt-1.5 text-[12px] text-error">
          {fieldErrors[id]}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[11px] text-ivory-50/35">
          {hint}
        </p>
      ) : null}
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-espresso px-6 py-16">
      <div className="w-full max-w-sm">
        <BrandMark label="Belioras — storefront" wrapperClassName="mx-auto block w-fit" />

        <p className="eyebrow mt-8 text-center">Atelier</p>
        <h1 className="mt-2 text-center font-display text-3xl tracking-wide text-ivory-50">
          Choose your password
        </h1>

        {/* Why they are here, and why they cannot leave. Said once, plainly,
            rather than as a warning they will learn to dismiss. */}
        <p className="mt-4 flex items-start gap-2.5 border border-gold-500/25 bg-gold-500/5 px-4 py-3 text-[12px] leading-relaxed text-ivory-50/70">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-gold-500" aria-hidden="true" />
          <span>
            You signed in with a temporary password. Choose your own to reach the dashboard — and
            anything you were signed in to elsewhere has been signed out.
          </span>
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
          {field("set-password-current", "Temporary password", currentPassword, setCurrentPassword, "current-password")}

          {field(
            "set-password-new",
            "New password",
            newPassword,
            setNewPassword,
            "new-password",
            "At least 8 characters.",
          )}

          {field("set-password-confirm", "Confirm new password", confirmPassword, setConfirmPassword, "new-password")}

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
            Save and continue
          </button>
        </form>

        {/* An escape hatch, and it is a real one: signing out is always
            available, because a person locked out of the dashboard by a
            password they cannot remember needs a way to stop trying. */}
        <button
          type="button"
          onClick={logout}
          className="mt-6 w-full text-center text-[11px] text-ivory-50/40 underline underline-offset-4 transition-colors hover:text-ivory-50/70"
        >
          Sign out instead
        </button>

        <p className="mt-6 text-center text-[11px] text-ivory-50/30">
          Trouble with the temporary password? Sign out, then ask an administrator to reset it.
        </p>
      </div>
    </div>
  );
}
