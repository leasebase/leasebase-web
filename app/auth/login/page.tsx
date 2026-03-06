import LoginPageClient from "./LoginPageClient";

type SearchParams = Record<string, string | string[] | undefined>;

const asString = (value: string | string[] | undefined): string | undefined =>
  typeof value === "string" ? value : undefined;

/**
 * /auth/login — thin server component that forwards search params to the
 * client component.  No force-dynamic, no headers() — Next.js can statically
 * optimize the outer shell while the client component handles all auth logic.
 */
export default function LoginPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
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
