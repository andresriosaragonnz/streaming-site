import type { Context } from "hono";
import { renderPortfolioGrid } from "./PlaylistPortfolioGrid";
import { getVideographers } from "../getVideographers";
import { getMediaSource } from "../../formatSegments/getMediaSource";

const MAX_ITEMS = 50;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

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

export const servePlaylistPortfolioCards = async (c: Context) => {
  const segParam = c.req.query("seg") || "";
  const nameParam = c.req.query("names") || "";
  const lParam = c.req.query("l") || "";

  try {
    const rawIds = decodeList(segParam);
    const rawNames = decodeList(nameParam);
    const rawLengths = decodeList(lParam);

    const candidates = rawIds
      .map((id, index) => ({
        id,
        name: rawNames[index] || "",
        length: rawLengths[index] || "0",
      }))
      .filter((candidate) => ID_PATTERN.test(candidate.id));

    const uniqueIds = Array.from(new Set(candidates.map(({ id }) => id)));

    if (uniqueIds.length === 0) {
      const empty = renderPortfolioGrid({ items: [] });
      c.header("Cache-Control", "no-store");
      return c.json(empty);
    }

    const placeholders = uniqueIds.map(() => "?").join(", ");
    const { results } = await c.env.DB.prepare(
      `SELECT id, artistName, videographer
       FROM segments
       WHERE id IN (${placeholders}) AND status = 'public'`,
    )
      .bind(...uniqueIds)
      .all();

    const rows = (results || []) as Array<{
      id: string;
      artistName: string;
      videographer: string;
    }>;

    const rowsById = new Map(rows.map((row) => [row.id, row]));
    const videographers = await getVideographers(c);
    const items = [];

    for (const candidate of candidates) {
      const row = rowsById.get(candidate.id);
      if (!row || !videographers[row.videographer]) continue;

      const media = getMediaSource(
        row.id,
        row.videographer,
        videographers,
      );
      const parsedLength = Number.parseInt(candidate.length, 10);
      const trackCount =
        Number.isFinite(parsedLength) && parsedLength >= 0
          ? Math.min(parsedLength, 10000)
          : 0;

      items.push({
        id: row.id,
        name: (candidate.name || row.artistName || row.id).trim().slice(0, 50),
        trackCount,
        cardImage: media.cardImage,
        heroImage: media.heroImage,
        segmentToken: media.segmentToken,
      });
    }

    const rendered = renderPortfolioGrid({ items });
    c.header("Cache-Control", "no-store");
    return c.json(rendered);
  } catch (err) {
    console.error("Failed to parse playlist portfolio parameters:", err);
    return c.json({ error: "Invalid portfolio payload" }, 400);
  }
};
