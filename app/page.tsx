import { headers } from "next/headers";
import LoginPageClient from "./auth/login/LoginPageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage() {
  headers(); // force dynamic — cannot be statically generated
  return <LoginPageClient next="/app" />;
}
