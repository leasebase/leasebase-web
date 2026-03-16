import type { Metadata } from "next";
import { LegalArticle } from "@/components/legal/LegalArticle";

export const metadata: Metadata = {
  title: "Terms of Service — LeaseBase",
};

export default function TermsPage() {
  return <LegalArticle markdownPath="docs/legal/terms-of-service.md" />;
}
