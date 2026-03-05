import { headers } from "next/headers";
import LoginPageClient from "./auth/login/LoginPageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Record<string, string | string[] | undefined>;

const asString = (value: string | string[] | undefined): string | undefined =>
  typeof value === "string" ? value : undefined;

export default function HomePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  headers();
  const next = asString(searchParams?.next) ?? "/app";
  return <LoginPageClient next={next} />;
}
