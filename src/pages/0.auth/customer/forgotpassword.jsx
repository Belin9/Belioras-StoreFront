/* Page: Auth - forgotpassword */
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, KeyRound, Loader2, MailCheck } from "lucide-react";

import BrandMark from "../../../components/shared/BrandMark";
import { requestPasswordReset } from "@/services/auth/authCustomerApi";
import { useToast } from "@/context/ToastContext";

/* HERO IMAGE */
const HERO_IMAGE = "https://ik.imagekit.io/sbgenu6wj/Belioras/Home/model-belioras123.jpeg";

const inputBase =
  "w-full border-b border-umber-50 bg-transparent px-0 py-3 text-sm text-espresso placeholder:text-espresso/40 focus:border-espresso focus:outline-none transition-colors";

export function FloatingInput({ id, label, type = "text", value, onChange, error, autoComplete }) {
  return (
    <div className="relative">
      <label
        htmlFor={id}
        className={`absolute top-3 text-xs font-semibold uppercase tracking-widest transition-all duration-200 pointer-events-none ${
          value ? "-translate-y-5 text-[10px] text-espresso/50" : "text-espresso/40"
        }`}
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        className={`${inputBase} ${error ? "border-rose-400" : ""}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
      toast("Check your inbox for a link to reset your password.", "success");
    } catch (err) {
      const message = err?.message ?? "Could not send the reset link. Please try again.";
      setError(message);
      toast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Editorial Image Panel */}
      <div className="relative hidden lg:block">
        <img
          src={HERO_IMAGE}
          alt="Belioras fashion"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/30 to-espresso/10" />
        <div className="absolute bottom-12 left-12 right-12 text-ivory-50">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold-400 mb-4">
            Secure Access
          </p>
          <h2 className="font-display text-4xl xl:text-5xl leading-tight mb-4">
            Reset your password <br /> securely.
          </h2>
          <p className="text-sm text-ivory-50/60 leading-relaxed max-w-sm">
            We'll send a secure link to your email so you can create a new password and regain access to your account.
          </p>
        </div>
      </div>

      {/* Right: Form Panel */}
      <div className="flex flex-col items-center justify-center px-6 py-12 sm:py-16 sm:px-12 lg:px-16 xl:px-24 bg-ivory-50 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="w-full max-w-sm"
        >
          {/* The brand mark, and the only route back to the shop from
              here. It sits inside the form column rather than the image panel
              because that panel is hidden below lg — so on a phone this was
              the one page with no Belioras branding anywhere on it. */}
          <BrandMark wrapperClassName="mb-10 block w-fit mx-auto lg:mx-0" />

          <div className="mb-10 text-center lg:text-left">
            <h1 id="forgot-title" className="font-display text-3xl lg:text-4xl text-espresso mb-3">
              {sent ? "Check your inbox" : "Reset password"}
            </h1>
            <p className="text-sm text-espresso/60">
              <Link to="/login" className="font-semibold text-gold-700 hover:text-espresso transition-colors cursor-pointer underline underline-offset-2">
                <ArrowLeft className="inline size-3 mr-1" />
                Back to sign in
              </Link>
            </p>
          </div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-gold-500/30 bg-gold-50/20 p-6 text-center"
            >
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold-500 text-ivory-50 mb-4">
                <MailCheck className="size-6" aria-hidden="true" />
              </span>
              <h2 className="font-display text-lg text-espresso mb-2">Email sent</h2>
              <p className="text-sm text-espresso/70 leading-relaxed">
                If an account exists for <span className="font-medium text-espresso">{email.trim()}</span>, reset
                instructions are on their way. The link works once, within an hour.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} noValidate aria-labelledby="forgot-title" className="space-y-6">
              <FloatingInput
                id="email"
                label="Email address"
                type="email"
                autoComplete="email"
                value={email}
                error={error}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-espresso text-ivory-50 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gold-700 hover:text-espresso transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm hover:shadow-md"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2 justify-center">
                    <Loader2 className="size-4 animate-spin" />
                    Sending link…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 justify-center">
                    <KeyRound className="size-4" />
                    Send reset link
                  </span>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}