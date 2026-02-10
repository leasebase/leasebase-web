import { redirect } from "next/navigation";

export default function HomePage() {
  // Entry point for authenticated users: send them to the AppShell.
  redirect("/app");
}
