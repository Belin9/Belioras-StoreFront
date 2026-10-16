/* Page: Auth - resetpassword */
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";

import BrandMark from "../../../components/shared/BrandMark";
import { confirmPasswordReset } from "@/services/auth/authCustomerApi";
import { useToast } from "@/context/ToastContext";
import { FloatingInput } from "./forgotpassword";

/**
 * Where the emailed reset link lands: `/reset-password?token=…`. Sets the new
 * password; the server uses the link up and signs the account out everywhere,
 * so the shopper signs in again with the new one.
 */
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setError(null);
    setSubmitting(true);
    try {
      await confirmPasswordReset({ token, password });
      toast("Password changed. Sign in with your new password.", "success");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err?.message ?? "Could not reset your password. Ask for a new link.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <BrandMark wrapperClassName="mb-10 block w-fit mx-auto" />
        <h1 className="mb-3 text-center font-display text-3xl text-espresso">Choose a new password</h1>
        <p className="mb-10 text-center text-sm text-espresso/60">
          <Link to="/forgot-password" className="font-semibold text-gold-700 underline underline-offset-2 hover:text-espresso">
            <ArrowLeft className="mr-1 inline size-3" />
            Need a new link?
          </Link>
        </p>

        {!token ? (
          <p role="alert" className="text-center text-sm text-rose-600">
            This link is incomplete. Open the one from your email again, or ask for a new one.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-8" noValidate>
            <FloatingInput
              id="password"
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <FloatingInput
              id="confirm"
              label="Repeat it"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={error}
            />
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 bg-espresso py-4 text-xs font-bold uppercase tracking-[0.2em] text-ivory-50 transition-colors hover:bg-espresso/90 disabled:opacity-60"
            >
              {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Set new password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
