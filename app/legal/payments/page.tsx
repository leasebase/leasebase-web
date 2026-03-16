import type { Metadata } from "next";
import { LegalArticle } from "@/components/legal/LegalArticle";

export const metadata: Metadata = {
  title: "Payment Terms — LeaseBase",
};

export default function PaymentsPage() {
  return <LegalArticle markdownPath="../docs/legal/payment-terms.md" />;
}
