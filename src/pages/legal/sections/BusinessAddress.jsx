/* Page: Legal - BusinessAddress */
import { Link } from "react-router-dom";

import { BUSINESS } from "../legalDetails";

/**
 * The contracting party and data controller. The owner's name and postal
 * address appear only in the Impressum, at her request, so this block names
 * the business and links there instead of repeating them.
 */
export default function BusinessAddress({ email = BUSINESS.support }) {
  return (
    <address className="not-italic text-espresso">
      {BUSINESS.name}
      <br />
      Email: <a href={`mailto:${email}`}>{email}</a>
      <br />
      Postal address: see our <Link to="/impressum">Impressum</Link>
    </address>
  );
}
