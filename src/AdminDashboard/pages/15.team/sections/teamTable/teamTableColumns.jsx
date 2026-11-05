/* Admin Dashboard Page: Team - teamTableColumns */
import Avatar from "../../../../../components/account/Avatar";
import { cn } from "../../../../../utils/cn";
import { reach } from "../../../../../utils/permissions";

/** "12 sections · 8 can change" — how far a role reaches, at a glance. */
function reachText(role) {
  if (!role) return "—";
  if (role.locked) return "Everything";
  const sections = reach(role);
  const edits = sections.filter((s) => role.permissions?.[s.id] === "edit" && !s.readOnly).length;
  return `${sections.length} ${sections.length === 1 ? "section" : "sections"}${edits ? ` · ${edits} to change` : " · view only"}`;
}

export function buildTeamColumns({ timeFmt, roles, lastSeen, signedInId, canManage, onStageRoleChange, onStageStatusChange }) {
  const roleOf = (id) => roles.find((r) => r.id === id);
  return [
    {
      accessorKey: "name",
      header: "Member",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar user={row.original} size="sm" />
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate font-medium text-espresso">
              {row.original.name}
              {/* Real, from the API: the account exists but has not replaced
                  the temporary password yet, so it cannot reach the dashboard.
                  Worth showing here because this table is where an admin looks
                  when someone says "I can't get in". */}
              {row.original.mustChangePassword && (
                <span
                  title="Has not replaced their temporary password yet"
                  className="bg-gold-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-gold-800"
                >
                  Password pending
                </span>
              )}
              {/* Suspended, not deleted: the account is intact, the role is
                  intact, and this row is where the "undo" lives. Marking it here
                  is what stops a suspended colleague looking simply employed. */}
              {row.original.status === "suspended" && (
                <span
                  title="Access removed — this account cannot sign in"
                  className="bg-error/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-error"
                >
                  Suspended
                </span>
              )}
              {row.original.id === signedInId && <span className="text-[11px] font-normal text-espresso-soft">(you)</span>}
            </p>
            <p className="truncate text-[11px] text-espresso-soft">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      sortingFn: (a, b) => (roleOf(a.original.role)?.name ?? "").localeCompare(roleOf(b.original.role)?.name ?? ""),
      cell: ({ row }) => {
        const member = row.original;
        // Your own row is read-only: changing it would revoke the access you are using.
        if (member.id === signedInId || !canManage) {
          return <span className="text-[13px] text-espresso">{roleOf(member.role)?.name ?? member.role}</span>;
        }
        // A suspended account has no role to speak of until it is restored, and
        // the server refuses the change anyway — so the box is shown disabled
        // with the reason on it, rather than inviting a click that will be
        // refused by the one authority that matters.
        if (member.status === "suspended") {
          return (
            <span
              title="Restore this account before changing its role."
              className="inline-flex cursor-not-allowed items-center text-[13px] text-espresso/50"
            >
              {roleOf(member.role)?.name ?? member.role}
            </span>
          );
        }
        return (
          <select
            value={member.role}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onStageRoleChange({ user: member, role: e.target.value })}
            aria-label={`Role for ${member.name}`}
            className="input h-9 max-w-52 py-1 text-[12px]"
          >
            {/* The Administrator role is not offered because the API refuses to
                grant it — an option that cannot be chosen is a trap, not a
                disabled field. It is also not offered for another reason: the
                API refuses to change an existing Administrator's role at all, so
                a target that is already one has no options to show. */}
            {roles.filter((r) => !r.locked).map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        );
      },
    },
    {
      id: "access",
      header: "Access",
      enableSorting: false,
      cell: ({ row }) => <span className="text-[12px] text-espresso-soft">{reachText(roleOf(row.original.role))}</span>,
    },
    {
      id: "lastSeen",
      header: "Last signed in",
      // From the server's audit log (`/activity/sign-ins`).
      enableSorting: false,
      accessorFn: (r) => lastSeen?.[r.id] ?? "",
      cell: ({ row }) => {
        const m = row.original;
        const at = lastSeen?.[m.id];
        if (at) {
          return <span className="whitespace-nowrap text-[12px] text-espresso-soft">{timeFmt.format(new Date(at))}</span>;
        }
        // The audit log has no sign-in for them yet: a new account, or one
        // that has not signed in since sign-ins were recorded.
        return <span className="text-[12px] text-espresso-soft">Not yet</span>;
      },
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      meta: { align: "right" },
      cell: ({ row }) => {
        const m = row.original;
        if (!canManage || m.id === signedInId) return null;
        // The undo is offered on the same row as the thing it undoes. An admin
        // who has just removed somebody's access is exactly the person most
        // likely to be asked to put it back, and the fastest way back is the one
        // that cannot be reached by looking in the wrong place.
        const suspended = m.status === "suspended";
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStageStatusChange({ user: m, status: suspended ? "active" : "suspended" });
            }}
            className={cn(
              "whitespace-nowrap text-[11px] uppercase tracking-[0.14em] transition-colors",
              suspended ? "text-espresso/45 hover:text-espresso" : "text-espresso/45 hover:text-error",
            )}
          >
            {suspended ? "Restore access" : "Remove access"}
          </button>
        );
      },
    },
  ];
}
