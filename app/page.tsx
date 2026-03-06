import { redirect } from "next/navigation";

/**
 * Root page — immediately redirects to the login page.
 *
 * In practice the middleware already handles "/" → "/auth/login", but this
 * server-side redirect acts as a safety net for any path that bypasses
 * middleware (e.g. direct RSC fetches during client navigation).
 */
export default function HomePage() {
  redirect("/auth/login");
}
