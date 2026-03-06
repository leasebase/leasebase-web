"use client";

import { PASSWORD_RULES, type PasswordValidationResult } from "@/lib/validation/password";

interface PasswordRequirementsProps {
  /** Result from `validatePassword()`. */
  result: PasswordValidationResult;
  /** Only show after the user has started typing. */
  dirty: boolean;
  /** HTML id used to associate this list with the password input via aria-describedby. */
  id?: string;
}

/**
 * Live checklist rendered below the password field.
 *
 * Each rule shows a small ✓ / ✗ icon coloured green / red.
 * When `dirty` is false the list renders in a neutral muted style so the
 * user isn't greeted by a wall of red before they start typing.
 */
export function PasswordRequirements({ result, dirty, id }: PasswordRequirementsProps) {
  return (
    <ul id={id} className="mt-1.5 space-y-0.5" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const passed = result.rules[rule.key];
        // Before the user types anything, show neutral/muted styling.
        const colour = !dirty ? "text-slate-500" : passed ? "text-emerald-400" : "text-red-400";

        return (
          <li key={rule.key} className={`flex items-center gap-1.5 text-xs ${colour}`}>
            {/* Icon: checkmark when passed, ✗ when failed, bullet when pristine */}
            {!dirty ? (
              <span className="w-3.5 text-center" aria-hidden="true">•</span>
            ) : passed ? (
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
