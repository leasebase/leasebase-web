import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

interface LegalArticleProps {
  /** Path to the markdown file, relative to the monorepo root (leasebase_all). */
  markdownPath: string;
}

/**
 * Server component that reads a legal markdown file at build time and
 * renders it as styled HTML.
 *
 * Uses `dangerouslySetInnerHTML` — safe because the content is our own
 * static legal documents, not user-generated content.
 */
export async function LegalArticle({ markdownPath }: LegalArticleProps) {
  // Resolve from the monorepo root (two levels up from leasebase-web)
  const absolutePath = path.resolve(process.cwd(), markdownPath);
  const markdown = fs.readFileSync(absolutePath, "utf-8");
  const html = await marked.parse(markdown);

  return (
    <article
      className="legal-prose"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
