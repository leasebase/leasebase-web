/**
 * Shared password-complexity rules.
 *
 * These mirror the Cognito user-pool password policy so the frontend can
 * give instant feedback before a round-trip.  The backend DTO only enforces
 * min-length; Cognito enforces the full policy and returns
 * `InvalidPasswordException` when rules are violated.
 */

export interface PasswordRule {
  /** Stable key used for React `key` and test selectors. */
  key: string;
  /** Human-readable label shown in the checklist. */
  label: string;
  /** Returns `true` when the rule is satisfied. */
  test: (pw: string) => boolean;
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  { key: "minLength", label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { key: "uppercase", label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { key: "lowercase", label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { key: "number", label: "One number", test: (pw) => /\d/.test(pw) },
  { key: "special", label: "One special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
] as const;

export interface PasswordValidationResult {
  /** Per-rule results keyed by `PasswordRule.key`. */
  rules: Record<string, boolean>;
  /** `true` when every rule passes. */
  valid: boolean;
}

/**
 * Validate a password against all complexity rules.
 *
 * Pure function — safe to call on every keystroke.
 */
export function validatePassword(password: string): PasswordValidationResult {
  const rules: Record<string, boolean> = {};
  for (const rule of PASSWORD_RULES) {
    rules[rule.key] = rule.test(password);
  }
  const valid = PASSWORD_RULES.every((r) => rules[r.key]);
  return { rules, valid };
}

/**
 * Returns `true` when a backend error message looks like a
 * Cognito / server-side password-complexity rejection.
 */
export function isPasswordComplexityError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("password") &&
    (lower.includes("requirement") ||
      lower.includes("policy") ||
      lower.includes("too short") ||
      lower.includes("must have") ||
      lower.includes("invalid") ||
      lower.includes("does not meet"))
  );
}
