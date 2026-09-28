/* Password Validation */

/**
 * The rule the API actually enforces.
 *
 * Not imported from `validateCredentials` because that one is deliberately
 * laxer — its 6-character floor is there to catch an empty box before a request
 * leaves, and the server is the authority. This screen is different: the person
 * filling it in has just been told their password is temporary, so they are
 * going to be careful, and being wrong here costs a round trip and a confusing
 * "Validation failed." with no field on it. Matching the server means the
 * message appears before the request rather than after it.
 */
export const MIN_PASSWORD_LENGTH = 8;

/** Longest value bcrypt will read. 72 bytes is the ceiling, not a choice. */
const MAX_PASSWORD_LENGTH = 72;

/**
 * Validates a password rotation: the temporary password they were given, the
 * replacement, and the confirmation.
 *
 * Keyed by input id rather than by API field name, so the caller can attach the
 * messages straight to the three boxes without translating. That mapping is
 * fixed here because the order is fixed by the form.
 */
export function validatePassword({ currentPassword, newPassword, confirmPassword } = {}) {
  const errors = {};

  if (!currentPassword) {
    errors["set-password-current"] = "Enter your temporary password.";
  }

  if (!newPassword) {
    errors["set-password-new"] = "Choose a password.";
  } else if (newPassword.length < MIN_PASSWORD_LENGTH) {
    errors["set-password-new"] = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  } else if (newPassword.length > MAX_PASSWORD_LENGTH) {
    errors["set-password-new"] = `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`;
  } else if (newPassword === currentPassword) {
    // Checked here as well as on the server: the server's answer arrives as a
    // field error too, but "this is the same password you just typed" is
    // obvious without asking anyone.
    errors["set-password-new"] = "Choose a password you haven't used here before.";
  }

  if (confirmPassword !== undefined) {
    if (!confirmPassword) {
      errors["set-password-confirm"] = "Type your new password again.";
    } else if (confirmPassword !== newPassword) {
      errors["set-password-confirm"] = "Those passwords don't match.";
    }
  }

  return errors;
}
