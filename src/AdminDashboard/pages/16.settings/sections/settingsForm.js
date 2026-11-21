/**
 * The two translations between settings.json and this page's flat form.
 *
 * Kept as pure functions so the shape of the stored document lives in one
 * readable place instead of being spread across a reset() call and a submit
 * handler at opposite ends of the file.
 */

const blankAddress = { street: "", postcode: "", city: "", country: "" };

/**
 * A stored address as its four parts. Read from the parts when they were
 * saved that way, otherwise taken apart from the older one-line form
 * ("street, 12345 City, Country") as well as it allows.
 */
function addressParts(parts, line) {
  if (parts) return { ...blankAddress, ...parts };
  const pieces = String(line ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (pieces.length < 3) return { ...blankAddress, street: pieces.join(", ") };
  const country = pieces.pop();
  const [, postcode = "", city = ""] = /^(\d{4,5})\s+(.+)$/.exec(pieces.at(-1)) ?? [];
  if (postcode) {
    pieces.pop();
    return { street: pieces.join(", "), postcode, city, country };
  }
  return { ...blankAddress, street: pieces.join(", "), country };
}

/** The four parts back into the one line the legal pages and footer print. */
function addressLine({ street, postcode, city, country }) {
  return [street, [postcode, city].filter(Boolean).join(" "), country].map((s) => String(s ?? "").trim()).filter(Boolean).join(", ");
}

const trimParts = (parts) => Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, String(v ?? "").trim()]));

/** settings.json -> flat form values. */
export function toFormValues(settings) {
  const boutique = addressParts(settings.contact?.boutiqueParts, settings.contact?.boutique);
  const gpsr = addressParts(settings.gpsr?.addressParts, settings.gpsr?.address);
  return {
    contactGeneral: settings.contact?.general ?? "",
    contactSupport: settings.contact?.support ?? "",
    contactPhone: settings.contact?.phone ?? "",
    contactWhatsapp: settings.contact?.whatsapp ?? "",
    contactHours: settings.contact?.hours ?? "",
    boutiqueStreet: boutique.street,
    boutiquePostcode: boutique.postcode,
    boutiqueCity: boutique.city,
    boutiqueCountry: boutique.country,
    announcements: (settings.announcements ?? []).map((m) => ({
      id: m.id,
      key: m.key ?? "",
      // The wording the key was written against: change it and the message
      // stops following its translation.
      keyText: m.key ? m.text : "",
      text: m.text ?? "",
      link: m.link ?? "",
      active: m.active !== false,
      start: (m.start ?? "").slice(0, 10),
      end: (m.end ?? "").slice(0, 10),
    })),
    cookieText: settings.cookieBanner?.text ?? "",
    // Always four slots, so the form has a row for each trust line.
    productTrust: [0, 1, 2, 3].map((i) => ({
      icon: settings.productPage?.trust?.[i]?.icon ?? "star",
      text: settings.productPage?.trust?.[i]?.text ?? "",
    })),
    productShipping: settings.productPage?.shipping ?? "",
    productPreOrder: settings.productPage?.preOrder ?? "",
    productReturns: settings.productPage?.returns ?? "",
    productResponsible: settings.productPage?.responsible ?? "",
    gpsrManufacturer: settings.gpsr?.manufacturer ?? "",
    gpsrStreet: gpsr.street,
    gpsrPostcode: gpsr.postcode,
    gpsrCity: gpsr.city,
    gpsrCountry: gpsr.country,
    gpsrEmail: settings.gpsr?.email ?? "",
    invoiceSellerName: settings.invoice?.sellerName ?? "",
    invoicePrefix: settings.invoice?.prefix ?? "BEL",
    invoiceVatId: settings.invoice?.vatId ?? "",
    invoiceTaxNumber: settings.invoice?.taxNumber ?? "",
    invoiceNote: settings.invoice?.note ?? "",
    // Stored as a fraction, edited as a percentage.
    taxRate: (settings.tax?.rate ?? 0) * 100,
    instagram: settings.social?.instagram ?? "",
    facebook: settings.social?.facebook ?? "",
    pinterest: settings.social?.pinterest ?? "",
    tiktok: settings.social?.tiktok ?? "",
  };
}

/** Flat form values -> settings.json. Shipping zones are their own page — see 17.shipping/. */
export function toSettingsPayload(values) {
  const boutique = trimParts({ street: values.boutiqueStreet, postcode: values.boutiquePostcode, city: values.boutiqueCity, country: values.boutiqueCountry });
  const gpsr = trimParts({ street: values.gpsrStreet, postcode: values.gpsrPostcode, city: values.gpsrCity, country: values.gpsrCountry });
  return {
    contact: {
      general: values.contactGeneral.trim(),
      support: values.contactSupport.trim(),
      phone: values.contactPhone.trim(),
      whatsapp: (values.contactWhatsapp ?? "").trim(),
      hours: values.contactHours.trim(),
      boutique: addressLine(boutique),
      boutiqueParts: boutique,
    },
    announcements: values.announcements
      .filter((m) => m.text.trim())
      .map((m) => ({
        id: m.id || `an-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        ...(m.key && m.text === m.keyText ? { key: m.key } : {}),
        text: m.text.trim(),
        link: m.link.trim(),
        active: Boolean(m.active),
        start: m.start,
        end: m.end,
      })),
    cookieBanner: { text: values.cookieText },
    productPage: {
      trust: (values.productTrust ?? []).filter((l) => l.text?.trim()).map((l) => ({ icon: l.icon, text: l.text.trim() })),
      shipping: (values.productShipping ?? "").trim(),
      preOrder: (values.productPreOrder ?? "").trim(),
      returns: (values.productReturns ?? "").trim(),
      responsible: (values.productResponsible ?? "").trim(),
    },
    gpsr: {
      manufacturer: values.gpsrManufacturer,
      address: addressLine(gpsr),
      addressParts: gpsr,
      email: values.gpsrEmail.trim(),
    },
    tax: { rate: Number(values.taxRate) / 100 },
    invoice: {
      sellerName: (values.invoiceSellerName ?? "").trim(),
      prefix: values.invoicePrefix.trim().toUpperCase() || "BEL",
      vatId: values.invoiceVatId.trim(),
      taxNumber: values.invoiceTaxNumber.trim(),
      note: values.invoiceNote.trim(),
    },
    social: {
      instagram: values.instagram,
      facebook: values.facebook,
      pinterest: values.pinterest,
      tiktok: values.tiktok,
    },
  };
}
