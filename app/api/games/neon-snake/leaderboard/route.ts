/**
 * GET /api/games/neon-snake/leaderboard
 *
 * Returns the top N deduplicated score entries for Neon Snake from Firestore.
 * The `scores` collection has `allow read: if true` so no auth token is needed.
 *
 * Query params:
 *   limit   – how many entries to return (default 10, max 20)
 *   score   – optional player score; response will include playerRank
 */

import { NextRequest, NextResponse } from 'next/server';

const GAME_ID = 'neon-snake';
const SCORES_COLLECTION = 'scores';

// ── Firestore REST helpers ────────────────────────────────

function firestoreValue(v: unknown): unknown {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v;
  return null;
}

/** Extract a Firestore field value to a plain JS value */
function extractField(field: Record<string, unknown>): unknown {
  if ('stringValue' in field)    return field.stringValue;
  if ('integerValue' in field)   return parseInt(field.integerValue as string, 10);
  if ('doubleValue' in field)    return parseFloat(field.doubleValue as string);
  if ('booleanValue' in field)   return field.booleanValue;
  if ('timestampValue' in field) return field.timestampValue;
  if ('nullValue' in field)      return null;
  if ('mapValue' in field) {
    const mapField = field.mapValue as { fields?: Record<string, Record<string, unknown>> };
    const result: Record<string, unknown> = {};
    for (const [k, fv] of Object.entries(mapField.fields ?? {})) {
      result[k] = extractField(fv);
    }
    return result;
  }
  if ('arrayValue' in field) {
    const arr = field.arrayValue as { values?: Array<Record<string, unknown>> };
    return (arr.values ?? []).map(extractField);
  }
  return null;
}

/** Convert a Firestore document's fields map to a plain object */
function docToObject(fields: Record<string, Record<string, unknown>>): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(fields)) {
    obj[key] = extractField(val);
  }
  return obj;
}

// ── Handler ───────────────────────────────────────────────

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    return NextResponse.json({ entries: [], error: 'Not configured' }, { status: 500 });
  }

  const { searchParams } = request.nextUrl;
  const limit  = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)));
  const playerScore = searchParams.has('score') ? parseInt(searchParams.get('score')!, 10) : null;

  try {
    // Query scores collection — publicly readable, ordered by score descending.
    // Fetch more than we need so we can deduplicate by userId server-side.
    const firestoreUrl =
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;

    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: SCORES_COLLECTION }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'gameId' },
            op: 'EQUAL',
            value: { stringValue: GAME_ID },
          },
        },
        orderBy: [{ field: { fieldPath: 'score' }, direction: 'DESCENDING' }],
        limit: limit * 20, // over-fetch to get enough unique users
      },
    };

    const resp = await fetch(firestoreUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryBody),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[Leaderboard API] Firestore query failed:', errText);
      return NextResponse.json({ entries: [] });
    }

    const rows = (await resp.json()) as Array<{ document?: { fields: Record<string, Record<string, unknown>> } }>;

    // Deduplicate: keep only the highest score per userId
    const bestByUser = new Map<string, { displayName: string; score: number; userId: string }>();

    for (const row of rows) {
      if (!row.document?.fields) continue;
      const d = docToObject(row.document.fields);
      const userId = d.userId as string | null;
      const score  = d.score  as number | null;
      const name   = (d.displayName as string | null) ?? 'Anonymous';

      if (!userId || typeof score !== 'number') continue;

      const existing = bestByUser.get(userId);
      if (!existing || existing.score < score) {
        bestByUser.set(userId, { userId, displayName: name.slice(0, 20), score });
      }
    }

    // Sort and take top N
    const sorted = Array.from(bestByUser.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const entries = sorted.map((entry, i) => ({
      rank:        i + 1,
      userId:      entry.userId,
      displayName: entry.displayName,
      score:       entry.score,
    }));

    // Calculate player rank if score was provided
    let playerRank: number | null = null;
    if (playerScore !== null) {
      // Count deduplicated entries with score strictly higher than player's
      const above = Array.from(bestByUser.values()).filter(e => e.score > playerScore).length;
      playerRank = above + 1;
    }

    return NextResponse.json(
      { entries, playerRank, total: bestByUser.size },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      },
    );
  } catch (err) {
    console.error('[Leaderboard API] Error:', err);
    return NextResponse.json({ entries: [] });
  }
}
