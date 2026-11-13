import type { Context } from "hono";
import { renderPortfolioGrid } from "./PlaylistPortfolioGrid";
import type { PortfolioItem } from "./PlaylistPortfolioGrid";
import { getVideographers } from "../getVideographers";
import { getMediaSource } from "../../formatSegments/getMediaSource";

const MAX_ITEMS = 50;
const MAX_TRACK_COUNT = 10_000;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

interface PortfolioCandidate {
  id: string;
  name: string;
  trackCount: number;
}

const decodeList = (value: string): string[] => {
  if (!value) return [];

  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    return atob(padded).split(",").slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
};

const parseTrackCount = (value: string | undefined): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0
    ? Math.min(parsed, MAX_TRACK_COUNT)
    : 0;
};

/**
 * Decodes the portfolio query once and returns only well-formed candidates.
 * Invalid IDs and duplicates are dropped before any database work happens.
 */
const parsePortfolioQuery = (
  segParam: string,
  nameParam: string,
  lengthParam: string,
): PortfolioCandidate[] => {
  const ids = decodeList(segParam);
  const names = decodeList(nameParam);
  const lengths = decodeList(lengthParam);

  const seen = new Set<string>();
  const candidates: PortfolioCandidate[] = [];

  for (let index = 0; index < ids.length; index++) {
    const id = ids[index];
    if (!ID_PATTERN.test(id) || seen.has(id)) continue;

    seen.add(id);
    candidates.push({
      id,
      name: (names[index] || "").trim().slice(0, 50),
      trackCount: parseTrackCount(lengths[index]),
    });
  }

  return candidates;
};

export const servePlaylistPortfolioCards = async (c: Context) => {
  const candidates = parsePortfolioQuery(
    c.req.query("seg") || "",
    c.req.query("names") || "",
    c.req.query("l") || "",
  );

  if (candidates.length === 0) {
    const empty = renderPortfolioGrid({ items: [] });
    c.header("Cache-Control", "no-store");
    return c.json(empty);
  }

  try {
    const ids = candidates.map(({ id }) => id);
    const placeholders = ids.map(() => "?").join(", ");
    const { results } = await c.env.DB.prepare(
      `SELECT id, artistName, videographer
       FROM segments
       WHERE id IN (${placeholders}) AND status = 'public'`,
    )
      .bind(...ids)
      .all();

    const rows = (results || []) as Array<{
      id: string;
      artistName: string;
      videographer: string;
    }>;

    const rowsById = new Map(rows.map((row) => [row.id, row]));
    const videographers = await getVideographers(c);
    const items: PortfolioItem[] = [];

    for (const candidate of candidates) {
      const row = rowsById.get(candidate.id);
      if (!row || !videographers[row.videographer]) continue;

      const media = getMediaSource(row.id, row.videographer, videographers);

      items.push({
        id: row.id,
        name: (candidate.name || row.artistName || row.id).trim().slice(0, 50),
        trackCount: candidate.trackCount,
        cardImage: media.cardImage,
        heroImage: media.heroImage,
        segmentToken: media.segmentToken,
      });
    }

    const rendered = renderPortfolioGrid({ items });
    c.header(
      "Cache-Control",
      "public, max-age=0, s-maxage=31536000, must-revalidate",
    );
    c.header("Cache-Tag", "public-feed");
    return c.json(rendered);
  } catch (err) {
    console.error("Failed to load playlist portfolio:", err);
    return c.json({ error: "Failed to load portfolio" }, 500);
  }
};
