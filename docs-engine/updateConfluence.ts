import axios, { AxiosInstance } from "axios";
import type { ConfluencePage } from "./generateConfluencePages.js";

/* ── Config ───────────────────────────────────────────────────── */

interface ConfluenceConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  spaceKey: string;
}

function getConfig(): ConfluenceConfig {
  const baseUrl = process.env.CONFLUENCE_BASE_URL;
  const email = process.env.CONFLUENCE_EMAIL;
  const apiToken = process.env.CONFLUENCE_API_TOKEN;
  const spaceKey = process.env.CONFLUENCE_SPACE_KEY;

  const missing: string[] = [];
  if (!baseUrl) missing.push("CONFLUENCE_BASE_URL");
  if (!email) missing.push("CONFLUENCE_EMAIL");
  if (!apiToken) missing.push("CONFLUENCE_API_TOKEN");
  if (!spaceKey) missing.push("CONFLUENCE_SPACE_KEY");

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return { baseUrl: baseUrl!, email: email!, apiToken: apiToken!, spaceKey: spaceKey! };
}

/* ── Confluence REST client ───────────────────────────────────── */

interface ConfluencePageResult {
  id: string;
  title: string;
  version: { number: number };
}

function createClient(config: ConfluenceConfig): AxiosInstance {
  const authHeader = Buffer.from(`${config.email}:${config.apiToken}`).toString("base64");
  return axios.create({
    baseURL: `${config.baseUrl}/wiki/rest/api`,
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
}

async function findPageByTitle(
  client: AxiosInstance,
  spaceKey: string,
  title: string,
): Promise<ConfluencePageResult | null> {
  try {
    const res = await client.get("/content", {
      params: {
        spaceKey,
        title,
        expand: "version",
      },
    });
    const results = res.data.results;
    if (results && results.length > 0) {
      return results[0] as ConfluencePageResult;
    }
    return null;
  } catch (err: any) {
    console.error(`  ⚠ Error finding page "${title}":`, err.response?.data?.message || err.message);
    return null;
  }
}

async function createPage(
  client: AxiosInstance,
  spaceKey: string,
  title: string,
  body: string,
  parentId?: string,
): Promise<string | null> {
  try {
    const payload: any = {
      type: "page",
      title,
      space: { key: spaceKey },
      body: {
        storage: {
          value: body,
          representation: "storage",
        },
      },
    };
    if (parentId) {
      payload.ancestors = [{ id: parentId }];
    }
    const res = await client.post("/content", payload);
    return res.data.id;
  } catch (err: any) {
    console.error(`  ✗ Error creating page "${title}":`, err.response?.data?.message || err.message);
    return null;
  }
}

async function updatePage(
  client: AxiosInstance,
  pageId: string,
  title: string,
  body: string,
  currentVersion: number,
): Promise<boolean> {
  try {
    await client.put(`/content/${pageId}`, {
      id: pageId,
      type: "page",
      title,
      body: {
        storage: {
          value: body,
          representation: "storage",
        },
      },
      version: {
        number: currentVersion + 1,
      },
    });
    return true;
  } catch (err: any) {
    console.error(`  ✗ Error updating page "${title}":`, err.response?.data?.message || err.message);
    return false;
  }
}

/* ── Public API ───────────────────────────────────────────────── */

export async function updateConfluencePages(pages: ConfluencePage[]): Promise<void> {
  const config = getConfig();
  const client = createClient(config);

  console.log(`\n📝 Updating ${pages.length} Confluence pages in space "${config.spaceKey}"...\n`);

  // Build a title→id map so child pages can reference their parent
  const titleToId = new Map<string, string>();

  // Process root page first, then children
  const root = pages.find((p) => !p.parentTitle);
  const children = pages.filter((p) => p.parentTitle);

  const ordered = root ? [root, ...children] : children;

  for (const page of ordered) {
    const existing = await findPageByTitle(client, config.spaceKey, page.title);

    if (existing) {
      console.log(`  ↻ Updating: "${page.title}" (v${existing.version.number} → v${existing.version.number + 1})`);
      const ok = await updatePage(client, existing.id, page.title, page.body, existing.version.number);
      if (ok) {
        titleToId.set(page.title, existing.id);
        console.log(`  ✓ Updated: "${page.title}"`);
      }
    } else {
      const parentId = page.parentTitle ? titleToId.get(page.parentTitle) : undefined;
      // If parent was not created yet, try to find it
      let resolvedParentId = parentId;
      if (!resolvedParentId && page.parentTitle) {
        const parentPage = await findPageByTitle(client, config.spaceKey, page.parentTitle);
        resolvedParentId = parentPage?.id;
      }

      console.log(`  + Creating: "${page.title}"${resolvedParentId ? ` (under "${page.parentTitle}")` : ""}`);
      const newId = await createPage(client, config.spaceKey, page.title, page.body, resolvedParentId);
      if (newId) {
        titleToId.set(page.title, newId);
        console.log(`  ✓ Created: "${page.title}" (id: ${newId})`);
      }
    }
  }

  console.log("\n✅ Confluence update complete.\n");
}

export { getConfig };
