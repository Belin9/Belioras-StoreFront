/* Context Provider: Staff Auth */
import { StaffAuthContext } from "./auth/authContexts";
import { useStaffSession } from "./auth/useStaffSession";

/**
 * Not the shopper's provider with a different flag: a separate context, fed by
 * a separate session, so signing out of the dashboard leaves a shopper's basket
 * alone and a staff token can never stand in for a customer one. The staff
 * session talks to the real API and keeps nothing in storage, which is a
 * different implementation, not a different setting.
 */
export default function StaffAuthProvider({ children }) {
  const value = useStaffSession();

  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>;
}
