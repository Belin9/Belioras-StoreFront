/* Common Component: CurrencySelector */
import { useCurrency } from "../../context/CurrencyContext";
import { useLanguage } from "../../context/LanguageContext";
import { CURRENCY_SYMBOLS } from "../../utils/formatCurrency";
import DropdownPill from "./DropdownPill";

// Tighter padding for the phone and tablet header, where it shares one row
// with the language picker and the bag.
const COMPACT_TRIGGER =
  "inline-flex min-h-11 items-center justify-center gap-0.5 px-1.5 text-[11px] uppercase tracking-[0.14em] text-current transition-opacity hover:opacity-70";

export default function CurrencySelector({ iconOnly = false, align = "right", compact = false }) {
  const { currency, setCurrency, currencies, symbol } = useCurrency();
  const { t } = useLanguage();

  return (
    <DropdownPill
      ariaLabel={t("common.currency", "Currency")}
      icon={
        <span className="text-base font-medium tabular-nums" aria-hidden="true">
          {symbol}
        </span>
      }
      // Compact: the symbol on phones (room is tight beside the bag), the code
      // from tablet width up, matching the desktop header.
      label={
        compact ? (
          <>
            <span className="sm:hidden">{symbol}</span>
            <span className="hidden sm:inline">{currency}</span>
          </>
        ) : (
          currency
        )
      }
      variant={iconOnly ? undefined : "code"}
      iconOnly={iconOnly}
      align={align}
      triggerClassName={compact ? COMPACT_TRIGGER : undefined}
      activeCode={currency}
      onSelect={setCurrency}
      options={currencies.map((code) => ({
        code,
        display: code,
        meta: CURRENCY_SYMBOLS[code],
      }))}
    />
  );
}
