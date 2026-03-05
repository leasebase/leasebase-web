import { redirect } from "next/navigation";

export default function HomePage() {
  // Unauthenticated visitors land here first; send them to the login page.
  // Authenticated users will be redirected from login → /app automatically.
  redirect("/auth/login");
}
