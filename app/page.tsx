import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function HomePage() {
  const cookieStore = cookies();
  const role = cookieStore.get("lb_role")?.value;

  // No session: land on login page
  if (!role) {
    redirect("/auth/login");
  }

  // Tenant session → tenant dashboard
  if (role === "TENANT") {
    redirect("/tenant");
  }

  // PM / landlord roles → management dashboard
  redirect("/pm");
}
