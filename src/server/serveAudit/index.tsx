import { AuditDashboard } from "./AuditDashboard";

export interface SegmentRow {
  id: string;
  artistName: string;
  title: string;
  hash: string;
  status: string;
  [key: string]: any;
}

export interface AuditedSegment extends SegmentRow {
  expectedFolder: string;
  existsInR2: boolean;
}

export interface AuditDataSummary {
  totalSegments: number;
  totalVerified: number;
  totalMissing: number;
  totalR2Folders: number;
}

export interface AuditDataResult {
  summary: AuditDataSummary;
  auditResults: AuditedSegment[];
  missingSegments: AuditedSegment[];
}

/**
 * Fetches D1 segment records and queries the remote R2 folder indexer worker
 * to cross-reference top-level folder names using `delimiter: "/"`.
 */
export const serveAudit = async (c: any) => {
  const db = c.env.DB as D1Database;
  const indexerUrl =
    c.env.REMOTE_R2_WORKER_URL || process.env.REMOTE_R2_WORKER_URL;
  const secret = c.env.REMOTE_R2_SECRET || process.env.REMOTE_R2_SECRET;
  if (!indexerUrl || !secret) {
    throw new Error(
      "Missing configuration: REMOTE_R2_WORKER_URL and REMOTE_R2_SECRET must be set in .dev.vars",
    );
  }

  // 1. Query D1 database for all segment entries
  const { results: segments } = await db
    .prepare("SELECT id, artistName, title, hash, status FROM segments")
    .all<SegmentRow>();

  const d1Segments = segments || [];

  // 2. Fetch top-level folder prefixes from the remote R2 indexer Worker
  const actualFolders = new Set<string>();
  let cursor: string | null = null;
  let truncated = true;

  while (truncated) {
    const url = new URL(indexerUrl);
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Remote Indexer HTTP ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as {
      folders: string[];
      truncated: boolean;
      cursor: string | null;
    };

    for (const folder of data.folders) {
      actualFolders.add(folder);
    }

    truncated = data.truncated;
    cursor = data.cursor;
  }

  // 3. Perform audit comparison (matching D1 segment hash to R2 folder)
  const auditResults: AuditedSegment[] = d1Segments.map((seg) => {
    const expectedFolder = seg.id;
    const existsInR2 = actualFolders.has(expectedFolder);

    return {
      ...seg,
      expectedFolder,
      existsInR2,
    };
  });

  const missingSegments = auditResults.filter((s) => !s.existsInR2);
  const totalVerified = auditResults.length - missingSegments.length;
  return c.html(
    <AuditDashboard
      data={{
        summary: {
          totalSegments: auditResults.length,
          totalVerified,
          totalMissing: missingSegments.length,
          totalR2Folders: actualFolders.size,
        },
        auditResults,
        missingSegments,
      }}
    />,
  );
};
