/* Context: ToastContext
 *
 * The context object and its hook. The value comes from ToastProvider
 * (ToastProvider.jsx); they live apart so fast refresh can keep the
 * provider's state while either file is edited.
 */
import { createContext, useContext } from "react";

export const ToastContext = createContext(null);

export function useToast() {

  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
