/* Admin Dashboard Page: Team - TeamTableDialogs */

import ConfirmDialog from "../../../../../components/ui/ConfirmDialog";
import { reach } from "../../../../../utils/permissions";

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
