import { headers } from "next/headers";
import LoginPageClient from "./LoginPageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Record<string, string | string[] | undefined>;

const asString = (value: string | string[] | undefined): string | undefined =>
  typeof value === "string" ? value : undefined;

export default function LoginPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  headers(); // force dynamic — cannot be statically generated
  const next = asString(searchParams?.next) ?? "/app";
  const registered = asString(searchParams?.registered);
  const registrationMessage = asString(searchParams?.message);

  return (
    <LoginPageClient
      next={next}
      registered={registered}
      registrationMessage={registrationMessage}
    />
  );
}
