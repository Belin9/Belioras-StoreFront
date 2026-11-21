/* Admin Dashboard: useListView */
import { useLocalStorage } from "@/hooks/useLocalStorage";

/** Cards or List for one list (see ViewToggle), remembered per list in this browser. */
export function useListView(listId, initial = "cards") {
  const [view, setView] = useLocalStorage(`belioras:dash:view:${listId}`, initial);
  return [view === "cards" || view === "list" ? view : initial, setView];
}
