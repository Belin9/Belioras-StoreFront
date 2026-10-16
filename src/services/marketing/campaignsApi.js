import { http } from "@/api/client";
import { resourcePath } from "@/api/routes";
import { audited } from "../auth/audited";

/**
 * Newsletter campaigns and the welcome email, on the server. Sending queues one
 * email per confirmed subscriber, each with its own unsubscribe link; a sent
 * campaign is the record of what went out and cannot be changed. Scheduled
 * campaigns are sent by the server when they are due.
 */

const staff = (path) => resourcePath(path, "staff");
const opts = { realm: "staff" };

export const getCampaigns = () => http.get(staff("newsletter/campaigns"), opts);
export const getAudienceSize = () => http.get(staff("newsletter/audience"), opts);
export const getNewsletterSettings = () => http.get(staff("newsletter/settings"), opts);

const saveCampaign$raw = (input = {}) => http.post(staff("newsletter/campaigns"), input, opts);
const scheduleCampaign$raw = (id, sendAt) => http.post(staff(`newsletter/campaigns/${encodeURIComponent(id)}/schedule`), { sendAt }, opts);
export const unscheduleCampaign = (id) => http.post(staff(`newsletter/campaigns/${encodeURIComponent(id)}/unschedule`), undefined, opts);
const sendCampaign$raw = (id) => http.post(staff(`newsletter/campaigns/${encodeURIComponent(id)}/send`), undefined, opts);
const deleteCampaign$raw = (id) => http.del(staff(`newsletter/campaigns/${encodeURIComponent(id)}`), opts);
const updateWelcomeEmail$raw = (input = {}) => http.put(staff("newsletter/welcome"), input, opts);

/* Recorded in the staff activity log. */
export const saveCampaign = audited("newsletter", (_, r) => `Saved campaign “${r.subject ?? "untitled"}”`, saveCampaign$raw);
export const scheduleCampaign = audited("newsletter", ([id]) => `Scheduled campaign ${id}`, scheduleCampaign$raw);
export const sendCampaign = audited("newsletter", (_, r) => `Sent campaign “${r.subject ?? ""}”`, sendCampaign$raw);
export const deleteCampaign = audited("newsletter", ([id]) => `Deleted campaign ${id}`, deleteCampaign$raw);
export const updateWelcomeEmail = audited("newsletter", () => "Updated the welcome email", updateWelcomeEmail$raw);
