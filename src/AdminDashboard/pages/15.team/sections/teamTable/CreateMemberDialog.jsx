/* Admin Dashboard: TeamTable — CreateMemberDialog */
import { useState } from "react";
import { Check, Copy, KeyRound, TriangleAlert } from "lucide-react";

import Modal from "../../../../../components/common/Modal";
import Button from "../../../../../components/ui/Button";
import Field from "../../../../../components/ui/Field";
import { cn } from "../../../../../utils/cn";

/**
 * Adds someone to the team with a temporary password they must replace.
 *
 * Not a replacement for `AddMemberDialog`, which is the invite flow and is
 * still mock-backed. The two are genuinely different mechanisms — an invite
 * means the person chooses their own password and no second person ever sees
 * one; a temporary password means one person picks it and hands it over — and
 * the API does the latter today. Both will exist; only one of them is real.
 *
 * The locked Administrator role is not offered, because the server refuses to
 * grant it. Hiding the option is the right behaviour for the same reason the
 * server refuses it: an Administrator is not a thing you hand out from a dialog,
 * it is the one account that makes the dialog possible. The list is filtered
 * rather than disabled so the person picking a role is not left wondering why
 * one of them is greyed out.
 */
function RoleOption({ role, selected, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col items-start gap-1 border px-4 py-3 text-left transition-colors",
        selected ? "border-espresso bg-espresso text-ivory-50" : "border-umber-100 bg-white hover:border-espresso/50",
      )}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="text-[14px] font-medium">{role.name}</span>
        {selected && <Check className="size-4 text-gold-400" aria-hidden="true" />}
      </span>
      <span className={cn("text-[12px] leading-snug", selected ? "text-ivory-50/70" : "text-espresso-soft")}>
        {role.description}
      </span>
    </button>
  );
}

/**
 * Remount with a `key` per opening, so a second attempt never shows the first
 * one's half-typed form or its result panel.
 */
export function CreateMemberDialog({ open, roles, onClose, onCreate }) {
  // The locked role is filtered out, so the default is the first grantable one
  // rather than whatever happened to be at index 0.
  const [form, setForm] = useState({ name: "", email: "", role: roles.find((r) => !r.locked)?.id, password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [copied, setCopied] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const grantable = roles.filter((r) => !r.locked);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors({});
    try {
      setDone(await onCreate({ ...form, email: form.email.trim() }));
    } catch (err) {
      // The server's per-field messages where it sent them ("Choose a role.",
      // "Password must be at least 8 characters."), and its general message
      // otherwise — a duplicate email, most often.
      setFieldErrors(err?.fieldErrors ?? {});
      setError(err?.fieldErrors ? "" : (err?.message ?? "Could not add that person."));
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(done.temporaryPassword);
      setCopied(true);
    } catch {
      setError("Could not copy — select the password and copy it by hand.");
    }
  };

  const roleName = roles.find((r) => r.id === done?.user.role)?.name;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={done ? `${done.user.name} can sign in` : "Add someone to the team"}
      width="max-w-2xl"
    >
      {done ? (
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
              <KeyRound className="size-5" aria-hidden="true" />
            </span>
            <p className="text-[14px] leading-relaxed text-espresso-soft">
              <strong className="font-medium text-espresso">{done.user.name}</strong> has{" "}
              {roleName} access. Give them this temporary password — it is the only time it will be
              shown, and it works once. The first thing they see when they sign in is a screen
              making them replace it.
            </p>
          </div>

          <div className="flex items-center gap-2 border border-umber-100 bg-white p-2 pl-3">
            <KeyRound className="size-4 shrink-0 text-espresso/40" aria-hidden="true" />
            <input
              readOnly
              value={done.temporaryPassword}
              onFocus={(e) => e.target.select()}
              aria-label="Temporary password"
              className="min-w-0 flex-1 bg-transparent font-mono text-[12px] text-espresso outline-none"
            />
            <Button size="sm" variant="secondary" icon={copied ? Check : Copy} onClick={copy}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          {/* Said once, here, because this is the last screen that can say it:
              the password is going to be read out, sent in a message, or written
              on a whiteboard, and that is the whole reason it is temporary. */}
          <p className="flex items-start gap-2.5 border-l-2 border-gold-500 bg-gold-500/5 py-2 pl-3 text-[12px] leading-relaxed text-espresso-soft">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-gold-700" aria-hidden="true" />
            <span>
              Only the hash is stored, so this cannot be shown again. Send it to them directly
              rather than in a group message, and they will be signed out everywhere else the
              moment they choose their own.
            </span>
          </p>

          {error && (
            <p role="alert" className="text-[13px] text-error">
              {error}
            </p>
          )}

          <div className="flex justify-end border-t border-umber-50 pt-4">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-6" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required>
              <input
                value={form.name}
                onChange={set("name")}
                autoComplete="off"
                autoFocus
                placeholder="Inês Camara"
                aria-invalid={Boolean(fieldErrors.name)}
              />
            </Field>
            <Field label="Work email" required>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                autoComplete="off"
                placeholder="name@belioras.com"
                aria-invalid={Boolean(fieldErrors.email)}
              />
            </Field>
          </div>

          {/* Stated here rather than only in the success panel, because by the
              time the panel appears it is too late to choose differently. */}
          <Field
            label="Temporary password"
            required
            helper="At least 8 characters. They replace it the first time they sign in."
            error={fieldErrors.password}
          >
            <input
              type="text"
              value={form.password}
              onChange={set("password")}
              autoComplete="off"
              placeholder="Ines-Atelier-2026"
              aria-invalid={Boolean(fieldErrors.password)}
            />
          </Field>

          <div>
            <p className="input-label">Role</p>
            <div role="radiogroup" aria-label="Role" className="grid gap-2 sm:grid-cols-2">
              {grantable.map((r) => (
                <RoleOption
                  key={r.id}
                  role={r}
                  selected={form.role === r.id}
                  onSelect={() => setForm((f) => ({ ...f, role: r.id }))}
                />
              ))}
            </div>
            <p className="mt-2 text-[12px] text-espresso-soft">
              Roles are edited under the Roles tab. You can change someone&rsquo;s role any time.
            </p>
          </div>

          {error && (
            <p role="alert" className="border-l-2 border-error py-1 pl-3 text-[13px] text-error">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-umber-50 pt-4">
            <p className="text-[12px] text-espresso-soft">They must change this before they reach the dashboard.</p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" icon={KeyRound} loading={saving}>
                Create account
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
