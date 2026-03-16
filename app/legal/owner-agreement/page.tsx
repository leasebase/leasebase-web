import type { Metadata } from "next";
import { LegalArticle } from "@/components/legal/LegalArticle";

export const metadata: Metadata = {
  title: "Property Owner Agreement — LeaseBase",
};

export default function OwnerAgreementPage() {
  return <LegalArticle markdownPath="docs/legal/owner-agreement.md" />;
}
