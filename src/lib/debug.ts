/**
 * Dev-only debug logger.
 *
 * Calls are completely eliminated from the production bundle because Next.js
 * replaces `process.env.NODE_ENV` at build time and dead-code elimination
 * removes the unreachable branch.
 */
export function devLog(label: string, ...args: unknown[]): void {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug(`[lb:${label}]`, ...args);
  }
}
