import LoginPageClient from "./auth/login/LoginPageClient";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return <LoginPageClient next="/app" />;
}
