import { redirect } from "next/navigation";

// Legacy route — redirect to the persona-aware AppShell dashboard.
export default function DashboardPage() {
  redirect("/app");
}
