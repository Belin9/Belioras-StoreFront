/* Accounts API */

// Team roles. Signing in, accounts, profiles and password resets live in
// `authCustomerApi.js` (shoppers) and `authStaffApi.js` (the atelier).
export { createRole, deleteRole, getRoles, updateRole } from "./authRoles";
