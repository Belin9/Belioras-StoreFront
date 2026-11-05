/* Admin Dashboard Page: Team - team */
import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, ShieldCheck, UserPlus } from "lucide-react";

import { useStaffAuth } from "@/context/auth/useAuthRealm";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { useLanguage } from "../../../context/LanguageContext";
import { useToast } from "../../../context/ToastContext";
import { queryKeyFor, useAsyncData } from "../../../hooks/useAsyncData";
import { ROLES } from "../../../utils/roles";
import {
  createRole, deleteRole, getRoles, updateRole,
} from "../../../services/auth/authApi";
import { createStaff, listStaff, updateStaffRole, updateStaffStatus } from "../../../services/auth/authStaffApi";
import DashHeaderActions from "../../components/DashHeaderActions";
import DashListToolbar from "../../components/DashListToolbar";
import DashTable from "../../components/DashTable";
import { usePageSize } from "../../lib/usePageSize";
import RoleEditorDialog from "./sections/roles/RoleEditorDialog";
import RolesPanel from "./sections/roles/RolesPanel";
import { buildTeamColumns } from "./sections/teamTable/teamTableColumns";
import { CreateMemberDialog } from "./sections/teamTable/CreateMemberDialog";
import { RoleChangeDialog, SuspendDialog } from "./sections/teamTable/TeamTableDialogs";

/**
 * Who works in the dashboard and what each of them can do. Members holds the
 * people; Roles holds what a role opens, section by section. Every change here
 * is written to the activity log.
 *
 * The member side is real: the roster, adding an account, changing somebody's
 * role and taking access away all go to the API, and the server decides who is
 * allowed to do each. The Roles tab — the editable catalogue of what each role
 * opens — is still the mock service, which is why it can still be marked as such
 * where it is called. That split is deliberate rather than half-finished: the
 * part that decides who can get in, and who no longer can, is the part that has
 * to be true, and it can be true on its own.
 */
export default function DashTeam() {
  const { locale } = useLanguage();
  const { toast } = useToast();
  const { user: signedIn } = useStaffAuth();

  /**
   * The server's rule, not the capability matrix's.
   *
   * `/admin/auth/staff` sits behind `requireRole("super-admin")`, so both the
   * roster and the create button are the administrator's alone. `canEdit("team")`
   * agrees today — the only role in the seed with edit access to Team is the
   * locked Administrator — but that is a fact about a mock catalogue the Roles
   * tab can rewrite, and until role editing is real it is a fact this page could
   * quietly stop being true about. Asking the question the server asks means the
   * button cannot drift into offering an action that comes back 403.
   */
  const canManage = signedIn?.role === ROLES.SUPER_ADMIN;

  const queryClient = useQueryClient();

  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((n) => n + 1), []);

  /**
   * The roster, from the server. React Query owns the caching and the refetch,
   * so `revision` is not in this key — bumping it would start a second,
   * competing cache of the same list. Invalidation goes through
   * `useQueryClient`, which is the whole reason the data layer was moved onto a
   * library: "this list is now wrong" is a statement about one key, not a
   * counter threaded through every reader.
   */
  const { data: staff, loading, error: rosterError } = useAsyncData(listStaff, []);
  const { data: roles } = useAsyncData(getRoles, [revision]);

  /**
   * No last-seen data, on purpose. The mock `lastSignIns` service only knows
   * about the accounts it invented, so wiring it to a roster that now comes
   * from the API would have every real member showing as "Not since logging
   * began" — which is not "no data", it is a false statement about a colleague
   * who signed in this morning. `null` renders the honest "Not tracked yet", and
   * passing real data here later changes nothing else.
   */
  const lastSeen = null;

  const [tab, setTab] = useState("members");
  const [query, setQuery] = useState("");
  const [pendingRole, setPendingRole] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [pendingDeleteRole, setPendingDeleteRole] = useState(null);
  const [adding, setAdding] = useState({ open: false, n: 0 });
  const [editing, setEditing] = useState({ open: false, role: null, n: 0 });
  const [pageSize, setPageSize] = usePageSize("team");

  const roleList = useMemo(() => roles ?? [], [roles]);

  /**
   * The server returns every staff account, newest first, and has no concept of
   * a customer — the roster *is* the staff table. The old filter is kept only to
   * drop a signed-out null during a refetch, not to exclude anyone.
   */
  const team = useMemo(() => staff ?? [], [staff]);

  const timeFmt = useMemo(() => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }), [locale]);

  const run = async (fn, message) => {
    try {
      const result = await fn();
      refresh();
      if (message) toast(typeof message === "function" ? message(result) : message, "success");
      return result;
    } catch (err) {
      toast(err.message ?? "That didn't work.", "error");
      return null;
    }
  };

  /**
   * Swaps one member for the server's version of them, wherever they sit in the
   * list. Returns the row it replaced, or null if the member has since gone.
   */
  const patchMember = (id, next) => {
    queryClient.setQueryData(queryKeyFor(listStaff), (current) =>
      (current ?? []).map((member) => (member.id === id ? { ...member, ...next } : member)));
  };

  /**
   * Applies a role change to the server and settles the roster from its answer.
   *
   * The row is updated in place rather than refetched. The response carries the
   * account exactly as the API now holds it — including `status`, which the
   * server preserved — so a refetch would cost a round trip to be told the same
   * thing, and would blank the table while it waited. If the server refused, the
   * thrown message is shown and the cache is never touched, so the dropdown
   * springs back to the truth instead of keeping the value the user picked.
   */
  const applyRole = async () => {
    const { user, role } = pendingRole;
    setPendingRole(null);
    const name = roleList.find((r) => r.id === role)?.name ?? role;
    const result = await run(
      () => updateStaffRole(user.id, role),
      () => `${user.name} is now ${name}.`,
    );
    if (result) patchMember(user.id, result);
  };

  /**
   * Suspends or restores access, and says which it did.
   *
   * "Remove access" is a suspension, not a demotion: the server ends the
   * sessions and refuses new sign-ins, and the role is left alone. The copy
   * reflects the real consequence, because the alternative — a cheerful
   * "removed" toast on an account that can still sign in — is the kind of
   * message that gets someone fired and then lets them back in.
   */
  const applyStatus = async () => {
    const { user, status } = pendingStatus;
    setPendingStatus(null);
    const suspending = status === "suspended";
    const result = await run(
      () => updateStaffStatus(user.id, status),
      () => (suspending
        ? `${user.name}'s access is removed. They have been signed out everywhere.`
        : `${user.name} can sign in again.`),
    );
      if (result) patchMember(user.id, result);
  };

  /**
   * Creates the account, then puts the new member at the top of the list.
   *
   * The list is updated from the server's answer rather than by refetching: the
   * create response carries the member exactly as the API now holds them, so a
   * round trip would only be a chance to be told the same thing. Sorting is
   * repeated here because the server orders by creation date, and an optimistic
   * insert that lands at the bottom of a "newest first" table looks like a bug.
   */
  const add = async (form) => {
    const result = await createStaff(form);
    queryClient.setQueryData(queryKeyFor(listStaff), (current) => [result.user, ...(current ?? [])]);
    return result;
  };

  const saveRole = async (form) => {
    const role = editing.role;
    const saved = role ? await updateRole(role.id, form) : await createRole(form);
    refresh();
    setEditing((e) => ({ ...e, open: false }));
    toast(`${saved.name} ${role ? "saved" : "created"}.`, "success");
  };

  const columns = useMemo(
    () =>
      buildTeamColumns({
        timeFmt, roles: roleList, lastSeen, signedInId: signedIn?.id, canManage,
        onStageRoleChange: setPendingRole,
        onStageStatusChange: setPendingStatus,
      }),
    [timeFmt, roleList, lastSeen, signedIn?.id, canManage],
  );

  const tabs = [
    { value: "members", label: "Members", count: team.length },
    { value: "roles", label: "Roles", count: roleList.length },
  ];

  return (
    <div className="space-y-5">
      {canManage && (
        <DashHeaderActions>
          {tab === "members" ? (
            <Button icon={UserPlus} size="sm" onClick={() => setAdding((d) => ({ open: true, n: d.n + 1 }))} className="h-10">
              Add<span className="hidden sm:inline"> member</span>
            </Button>
          ) : (
            <Button icon={Plus} size="sm" onClick={() => setEditing((e) => ({ open: true, role: null, n: e.n + 1 }))} className="h-10">
              New role
            </Button>
          )}
        </DashHeaderActions>
      )}

      {tab === "members" ? (
        <>
          {/*
            A roster that failed to load and a roster with nobody in it look the
            same on this page — the table renders rows out of `team`, and an
            empty array has no rows. Saying so is the difference between "there
            is no one here" and "we could not ask".
          */}
          {rosterError && !loading && (
            <p role="alert" className="border border-error/30 bg-error/5 px-4 py-3 text-[13px] text-error">
              {rosterError.status === 403
                ? "You do not have permission to view the team roster."
                : "Could not load the team roster. Please try again."}
            </p>
          )}

          <DashListToolbar
            tabs={tabs}
            tab={tab}
            onTabChange={setTab}
            tabsLabel="Team"
            query={query}
            onQueryChange={setQuery}
            placeholder="Search the team"
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
          <DashTable
            columns={columns}
            data={team}
            loading={loading}
            globalFilter={query}
            initialSorting={[{ id: "role", desc: false }]}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            unit={team.length === 1 ? "member" : "members"}
            empty={{ icon: ShieldCheck, title: "No one on the team matches that search" }}
          />
        </>
      ) : (
        <>
          <DashListToolbar tabs={tabs} tab={tab} onTabChange={setTab} tabsLabel="Team" />
          <p className="max-w-3xl text-[13px] leading-relaxed text-espresso-soft">
            A role decides what someone sees in the dashboard. For each section it gives <strong className="font-medium text-espresso">Edit</strong>,{" "}
            <strong className="font-medium text-espresso">View</strong> (look, change nothing) or <strong className="font-medium text-espresso">No access</strong>{" "}
            (hidden from the sidebar). Changes apply the moment you save, even to people already signed in.
          </p>
          <RolesPanel
            roles={roleList}
            canManage={canManage}
            onEdit={(role) => setEditing((e) => ({ open: true, role, n: e.n + 1 }))}
            onDelete={setPendingDeleteRole}
          />
        </>
      )}

      <RoleChangeDialog pending={pendingRole} roles={roleList} onClose={() => setPendingRole(null)} onConfirm={applyRole} />
      <SuspendDialog pending={pendingStatus} onClose={() => setPendingStatus(null)} onConfirm={applyStatus} />

      {/* The real one: creates the account through the API. It replaces the
          invitation dialog, which is mock-backed and described a flow the server
          does not implement — an account created here exists immediately and
          signs in with the password the administrator chose. */}
      <CreateMemberDialog
        key={adding.n}
        open={adding.open}
        roles={roleList}
        onClose={() => setAdding((d) => ({ ...d, open: false }))}
        onCreate={add}
      />

      <RoleEditorDialog
        key={`role-${editing.n}`}
        open={editing.open}
        role={editing.role}
        roles={roleList}
        onClose={() => setEditing((e) => ({ ...e, open: false }))}
        onSave={saveRole}
      />

      <ConfirmDialog
        open={Boolean(pendingDeleteRole)}
        onClose={() => setPendingDeleteRole(null)}
        onConfirm={async () => {
          const r = pendingDeleteRole;
          setPendingDeleteRole(null);
          await run(() => deleteRole(r.id), `${r.name} deleted.`);
        }}
        title={`Delete the ${pendingDeleteRole?.name ?? ""} role?`}
        description="Nobody can hold it any more. A role that people still hold can't be deleted until they have another."
        confirmLabel="Delete role"
      />
    </div>
  );
}
