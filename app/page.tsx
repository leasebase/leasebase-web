import { redirect } from "next/navigation";

export default function HomePage() {
  // For now, always send users to the generic dashboard.
  // The dashboard itself will check whether a login token exists
  // and bounce unauthenticated users back to /auth/login.
  redirect("/dashboard");
}
