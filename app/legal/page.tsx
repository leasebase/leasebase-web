import type { Metadata } from "next";
import { LEGAL_DOCUMENTS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Legal Documents — LeaseBase",
};

export default function LegalIndexPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Legal Documents</h1>
      <p className="text-slate-600">
        The following legal documents govern your use of the LeaseBase platform.
      </p>
      <ul className="space-y-3">
        {LEGAL_DOCUMENTS.map((doc) => (
          <li key={doc.slug}>
            <a
              href={doc.path}
              className="text-brand-600 hover:text-brand-500 font-medium transition-colors"
            >
              {doc.title}
            </a>
            <span className="ml-2 text-xs text-slate-400">
              v{doc.version} · Effective {doc.effectiveDate}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
