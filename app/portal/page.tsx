import { redirect } from "next/navigation";

/**
 * Portal selector page — no longer needed post-migration.
 * All users sign in from the shared /auth/login page.
 * Redirect here for any legacy bookmarks or links.
 */
export default function PortalSelectorPage() {
  redirect("/auth/login");
}
