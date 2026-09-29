/* Admin Dashboard Page: Team - TeamTableDialogs */
import { useState } from "react";
import { Check, Copy, Link2, Mail } from "lucide-react";

import Modal from "../../../../../components/common/Modal";
import Button from "../../../../../components/ui/Button";
import ConfirmDialog from "../../../../../components/ui/ConfirmDialog";
import Field from "../../../../../components/ui/Field";
import { cn } from "../../../../../utils/cn";
import { reach } from "../../../../../utils/permissions";
import { inviteUrl } from "./inviteUrl";

export function RoleChangeDialog({ pending, roles, onClose, onConfirm }) {
  const role = roles.find((r) => r.id === pending?.role);

  return (
    <ConfirmDialog
      open={Boolean(pending)}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Make ${pending?.user.name ?? "them"} ${role?.name ?? ""}?`}
      description={
        role?.locked
          ? "Administrators can see and change everything, including who else has access."
          : role?.description
      }
      summary={
        pending && role && (
          <span className="text-[12px] text-espresso-soft">
            {role.locked ? "Every section" : reach(role).map((s) => s.label).join(" · ")}
          </span>
        )
      }
      confirmLabel="Change role"
    />
  );
}

/**
 * "Remove access", which is a suspension and not a demotion.
 *
 * It used to be this dialog's other mode — the same box, reached by asking for
 * the "customer" role — and that was a lie in two directions. The server has no
 * customer role to give a staff account, and a demotion would not have ended
 * anything: the person would still have signed in, straight back into a role
 * that opens nothing. Suspension is the operation that actually matches the
 * words, so it gets its own dialog and its own honest description of what
 * happens to the sessions.
 */
export function SuspendDialog({ pending, onClose, onConfirm }) {
  // `pending.status` is where the account is being *put*, so this asks where it
  // is going, not where it is. Reading it the other way round made the remove
  // dialog render as the restore one, which asked a question about the wrong
  // operation and offered the wrong button to answer it.
  const suspending = pending?.status === "suspended";

  return (
    <ConfirmDialog
      open={Boolean(pending)}
      onClose={onClose}
      onConfirm={onConfirm}
      destructive={suspending}
      title={
        suspending
          ? `Remove ${pending?.user.name ?? "them"}'s access?`
          : `Give ${pending?.user.name ?? "them"} their access back?`
      }
      description={
        suspending
          ? "They are signed out everywhere and cannot sign in again until this is undone. Their role is kept, so restoring puts them back in the same job."
          : "They can sign in again, with the role they had before. Their password is unchanged."
      }
      confirmLabel={suspending ? "Remove access" : "Restore access"}
    />
  );
}

/** A role to pick: its name, one line, and the sections it opens. */
function RoleOption({ role, selected, onSelect }) {
  const sections = role.locked ? null : reach(role);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col items-start gap-1.5 border px-4 py-3 text-left transition-colors",
        selected ? "border-espresso bg-espresso text-ivory-50" : "border-umber-100 bg-white hover:border-espresso/50",
      )}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="text-[14px] font-medium">{role.name}</span>
        {selected && <Check className="size-4 text-gold-400" aria-hidden="true" />}
      </span>
      <span className={cn("text-[12px] leading-snug", selected ? "text-ivory-50/70" : "text-espresso-soft")}>{role.description}</span>
      <span className="flex flex-wrap gap-1">
        {(sections ? sections.slice(0, 4) : [{ id: "all", label: "Everything" }]).map((s) => (
          <span key={s.id} className={cn("px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em]", selected ? "bg-ivory-50/10 text-ivory-50/80" : "bg-umber-50 text-espresso-soft")}>
            {s.label}
          </span>
        ))}
        {sections && sections.length > 4 && (
          <span className={cn("px-1.5 py-0.5 text-[10px]", selected ? "text-ivory-50/70" : "text-espresso-soft")}>+{sections.length - 4}</span>
        )}
      </span>
    </button>
  );
}

/**
 * Invite someone: name, email, role. They get a link to set their own
 * password, so nobody else ever knows it. An email that already has a
 * customer account is simply given access. Remount with a `key` per opening.
 */
export function AddMemberDialog({ open, roles, onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", email: "", role: roles.find((r) => r.id === "staff")?.id ?? roles[0]?.id });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [copied, setCopied] = useState(false);
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      setDone(await onAdd(form));
    } catch (err) {
      setError(err.message ?? "Could not add that person.");
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl(done.token));
      setCopied(true);
    } catch {
      setError("Could not copy — select the link and copy it by hand.");
    }
  };

  const roleName = roles.find((r) => r.id === (done?.user.role ?? form.role))?.name;

  return (
    <Modal open={open} onClose={onClose} title={done ? (done.invited ? "Invitation ready" : "Access given") : "Invite to the team"} width="max-w-2xl">
      {done ? (
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
              {done.invited ? <Mail className="size-5" aria-hidden="true" /> : <Check className="size-5" aria-hidden="true" />}
            </span>
            <p className="text-[14px] leading-relaxed text-espresso-soft">
              {done.invited ? (
                <>
                  <strong className="font-medium text-espresso">{done.user.name}</strong> is invited as {roleName}. Send them
                  this link: they choose their own password and can then sign in at the atelier door. It stops working once used.
                </>
              ) : (
                <>
                  <strong className="font-medium text-espresso">{done.user.name}</strong> already had a Belioras account and now has{" "}
                  {roleName} access. They sign in at the atelier door with the password they already use.
                </>
              )}
            </p>
          </div>

          {done.invited && (
            <div className="flex items-center gap-2 border border-umber-100 bg-white p-2 pl-3">
              <Link2 className="size-4 shrink-0 text-espresso/40" aria-hidden="true" />
              <input readOnly value={inviteUrl(done.token)} onFocus={(e) => e.target.select()} aria-label="Invitation link" className="min-w-0 flex-1 bg-transparent font-mono text-[12px] text-espresso outline-none" />
              <Button size="sm" variant="secondary" icon={copied ? Check : Copy} onClick={copy}>
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          )}
          {done.invited && (
            <p className="text-[12px] text-espresso-soft">Once email is connected, this link is sent to {done.user.email} automatically.</p>
          )}
          {error && <p role="alert" className="text-[13px] text-error">{error}</p>}

          <div className="flex justify-end border-t border-umber-50 pt-4">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required>
              <input value={form.name} onChange={set("name")} autoComplete="off" autoFocus placeholder="Inês Camara" />
            </Field>
            <Field label="Work email" required>
              <input type="email" value={form.email} onChange={set("email")} autoComplete="off" placeholder="name@belioras.com" />
            </Field>
          </div>

          <div>
            <p className="input-label">Role</p>
            <div role="radiogroup" aria-label="Role" className="grid gap-2 sm:grid-cols-2">
              {roles.map((r) => (
                <RoleOption key={r.id} role={r} selected={form.role === r.id} onSelect={() => setForm((f) => ({ ...f, role: r.id }))} />
              ))}
            </div>
            <p className="mt-2 text-[12px] text-espresso-soft">Roles are edited under the Roles tab. You can change someone&rsquo;s role any time.</p>
          </div>

          {error && <p role="alert" className="border-l-2 border-error py-1 pl-3 text-[13px] text-error">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-umber-50 pt-4">
            <p className="text-[12px] text-espresso-soft">They set their own password from the invitation.</p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" icon={Mail} loading={saving}>Create invitation</Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
