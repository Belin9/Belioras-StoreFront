/* Accounts API */

// Roles and the (browser-side) team invitation flow. Signing in, accounts,
// profiles and password resets are on the server now: `authCustomerApi.js`
// for shoppers, `authStaffApi.js` for the atelier.
export {
  acceptInvite, addTeamMember, cancelInvite, createRole, deleteRole, getInvite, getRoles, renewInvite, updateRole, updateUserRole,
} from "./authRoles";
