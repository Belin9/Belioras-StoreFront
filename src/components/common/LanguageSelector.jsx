/* Common Component: LanguageSelector */
import { Globe } from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";
import DropdownPill from "./DropdownPill";

// Tighter padding for the phone and tablet header, where it shares one row
// with the currency picker and the bag.
const COMPACT_TRIGGER =
  "inline-flex min-h-11 items-center justify-center gap-0.5 px-1.5 text-[11px] uppercase tracking-[0.14em] text-current transition-opacity hover:opacity-70";

export default function LanguageSelector({ iconOnly = false, align = "right", compact = false }) {
  const { language, setLanguage, locales, t } = useLanguage();

  return (
    <DropdownPill
      ariaLabel={t("common.language", "Language")}
      icon={<Globe className="size-5" aria-hidden="true" />}
      label={language.toUpperCase()}
      variant={iconOnly ? undefined : "code"}
      iconOnly={iconOnly}
      align={align}
      triggerClassName={compact ? COMPACT_TRIGGER : undefined}
      activeCode={language}
      onSelect={setLanguage}
      options={locales.map((l) => ({
        code: l.code,
        display: l.label,
        meta: l.code.toUpperCase(),
      }))}
    />
  );
}
