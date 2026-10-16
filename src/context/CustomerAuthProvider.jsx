/* Context Provider: Customer Auth */
import { CustomerAuthContext } from "./auth/authContexts";
import { useCustomerSession } from "./auth/useCustomerSession";

export default function CustomerAuthProvider({ children }) {
  const value = useCustomerSession();

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}
