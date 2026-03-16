import type { Metadata } from "next";
import { LegalArticle } from "@/components/legal/LegalArticle";

export const metadata: Metadata = {
  title: "Privacy Policy — LeaseBase",
};

export default function PrivacyPage() {
  return <LegalArticle markdownPath="../docs/legal/privacy-policy.md" />;
}
