import type { Metadata } from "next";
import { LegalArticle } from "@/components/legal/LegalArticle";

export const metadata: Metadata = {
  title: "Tenant User Agreement — LeaseBase",
};

export default function TenantAgreementPage() {
  return <LegalArticle markdownPath="../docs/legal/tenant-agreement.md" />;
}
