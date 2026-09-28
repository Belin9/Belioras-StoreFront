/* Admin Dashboard Page: Team - teamTableColumns */
import { Copy, RefreshCw, X } from "lucide-react";

import Avatar from "../../../../../components/account/Avatar";
import IconAction from "../../../../components/IconAction";
import { reach } from "../../../../../utils/permissions";

/** "12 sections · 8 can change" — how far a role reaches, at a glance. */
function reachText(role) {
  if (!role) return "—";
  if (role.locked) return "Everything";
  const sections = reach(role);
  const edits = sections.filter((s) => role.permissions?.[s.id] === "edit" && !s.readOnly).length;
  return `${sections.length} ${sections.length === 1 ? "section" : "sections"}${edits ? ` · ${edits} to change` : " · view only"}`;
}

export function buildTeamColumns({ dateFmt, timeFmt, roles, lastSeen, signedInId, canManage, canChangeRole = false, onStageRoleChange, onCopyInvite, onRenewInvite, onCancelInvite }) {
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
              {row.original.status === "invited" && (
                <span className="bg-gold-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-gold-800">Invited</span>
              )}
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
        // Changing someone's role is still on the mock service, which would
        // report success and leave the API holding the old value. The field stays
        // visible and disabled rather than disappearing, so the shape of what is
        // coming is honest and so nobody reads the absence as a missing feature.
        if (!canChangeRole) {
          return (
            <span
              title="Changing a role is not available yet — this table is live, role changes are not."
              className="inline-flex cursor-not-allowed items-center gap-1.5 text-[13px] text-espresso/50"
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
            {/* The Administrator role is not offered. `updateUserRole` is still
                on the mock service, but it will be moved behind the API, and the
                API refuses to grant that role — so an option that cannot be
                chosen is a trap, not a disabled field. */}
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
      // The API does not report a last-seen time yet, and this table now reads
      // from it. Sorting on a column nothing populates would silently put every
      // member in an arbitrary order, so the column stays and the sort goes.
      enableSorting: false,
      accessorFn: (r) => lastSeen?.[r.id] ?? "",
      cell: ({ row }) => {
        const m = row.original;
        if (m.status === "invited") {
          return (
            <span className="text-[12px] text-espresso-soft">
              Invited {m.invitedAt ? dateFmt.format(new Date(m.invitedAt)) : ""}
            </span>
          );
        }
        const at = lastSeen?.[m.id];
        if (at) {
          return <span className="whitespace-nowrap text-[12px] text-espresso-soft">{timeFmt.format(new Date(at))}</span>;
        }
        // "Not since logging began" was the mock's way of saying "no data" — for
        // a real account it is a lie, because the API simply does not collect it
        // yet and they may well have signed in this morning.
        return <span className="text-[12px] text-espresso-soft">Not tracked yet</span>;
      },
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      meta: { align: "right" },
      cell: ({ row }) => {
        const m = row.original;
        if (!canManage || !canChangeRole || m.id === signedInId) return null;
        if (m.status === "invited") {
          return (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <IconAction label={`Copy ${m.name}'s invitation link`} icon={Copy} onClick={() => onCopyInvite(m)} />
              <IconAction label={`New invitation link for ${m.name}`} icon={RefreshCw} onClick={() => onRenewInvite(m)} />
              <IconAction label={`Withdraw ${m.name}'s invitation`} icon={X} destructive onClick={() => onCancelInvite(m)} />
            </div>
          );
        }
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStageRoleChange({ user: m, role: "customer" });
            }}
            className="whitespace-nowrap text-[11px] uppercase tracking-[0.14em] text-espresso/45 transition-colors hover:text-error"
          >
            Remove access
          </button>
        );
      },
    },
  ];
}
