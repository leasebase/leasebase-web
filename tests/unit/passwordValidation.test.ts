import {
  validatePassword,
  isPasswordComplexityError,
  PASSWORD_RULES,
} from "@/lib/validation/password";

describe("validatePassword", () => {
  test("empty string fails all rules", () => {
    const result = validatePassword("");
    expect(result.valid).toBe(false);
    for (const rule of PASSWORD_RULES) {
      expect(result.rules[rule.key]).toBe(false);
    }
  });

  test("short lowercase-only string fails most rules", () => {
    const result = validatePassword("abc");
    expect(result.valid).toBe(false);
    expect(result.rules.minLength).toBe(false);
    expect(result.rules.uppercase).toBe(false);
    expect(result.rules.lowercase).toBe(true);
    expect(result.rules.number).toBe(false);
    expect(result.rules.special).toBe(false);
  });

  test("valid password passes all rules", () => {
    const result = validatePassword("MyP@ss1234");
    expect(result.valid).toBe(true);
    for (const rule of PASSWORD_RULES) {
      expect(result.rules[rule.key]).toBe(true);
    }
  });

  test("exactly 8 chars with all requirements passes", () => {
    const result = validatePassword("Aa1!xxxx");
    expect(result.valid).toBe(true);
  });

  test("8+ chars but missing uppercase fails", () => {
    const result = validatePassword("abcd1234!");
    expect(result.valid).toBe(false);
    expect(result.rules.uppercase).toBe(false);
    expect(result.rules.minLength).toBe(true);
  });

  test("8+ chars but missing number fails", () => {
    const result = validatePassword("Abcdefgh!");
    expect(result.valid).toBe(false);
    expect(result.rules.number).toBe(false);
  });

  test("8+ chars but missing special character fails", () => {
    const result = validatePassword("Abcdefg1");
    expect(result.valid).toBe(false);
    expect(result.rules.special).toBe(false);
  });

  test("space counts as special character", () => {
    const result = validatePassword("Aa1 xxxx");
    expect(result.rules.special).toBe(true);
  });
});

describe("isPasswordComplexityError", () => {
  test.each([
    "Password does not meet requirements",
    "Password policy not met",
    "Password must have uppercase",
    "password too short",
    "Invalid password",
  ])('returns true for "%s"', (msg) => {
    expect(isPasswordComplexityError(msg)).toBe(true);
  });

  test.each([
    "An account with this email already exists",
    "Network error",
    "Registration failed",
  ])('returns false for "%s"', (msg) => {
    expect(isPasswordComplexityError(msg)).toBe(false);
  });
});
