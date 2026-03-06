/**
 * POST /api/games/neon-snake/scores
 *
 * Submits a score from a standalone (non-embedded) game session.
 * Uses Firebase Anonymous Auth to obtain an ID token, then writes to
 * Firestore via REST API — satisfying the `isSignedIn()` Firestore rule.
 *
 * This route is only called when the game is NOT embedded in the hub.
 * When embedded, the hub's game-client.tsx handles score submission.
 *
 * Body: { score: number, displayName?: string, metadata?: object }
 */

import { NextRequest, NextResponse } from 'next/server';

const GAME_ID = 'neon-snake';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const apiKey   = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!apiKey || !projectId) {
    return NextResponse.json({ success: false, error: 'Not configured' }, { status: 500 });
  }

  let body: { score?: unknown; displayName?: unknown; metadata?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const score       = Number(body.score);
  const displayName = String(body.displayName ?? 'Guest').slice(0, 20);
  const metadata    = (body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata))
    ? body.metadata as Record<string, unknown>
    : {};

  if (!Number.isFinite(score) || score < 0 || score > 100_000_000) {
    return NextResponse.json({ success: false, error: 'Invalid score' }, { status: 400 });
  }

  try {
    // ── 1. Sign in anonymously ────────────────────────────
    const authResp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUpNewUser?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
    );

    if (!authResp.ok) {
      const errBody = await authResp.text();
      console.error('[Scores API] Anonymous auth failed:', errBody);
      return NextResponse.json({ success: false, error: 'Auth failed' }, { status: 500 });
    }

    const { idToken, localId: userId } = (await authResp.json()) as {
      idToken: string;
      localId: string;
    };

    // ── 2. Build Firestore field map ──────────────────────
    function toFirestoreValue(v: unknown): Record<string, unknown> {
      if (typeof v === 'string')  return { stringValue: v };
      if (typeof v === 'number')  return { integerValue: String(Math.round(v)) };
      if (typeof v === 'boolean') return { booleanValue: v };
      return { nullValue: null };
    }

    const metaFields: Record<string, Record<string, unknown>> = {};
    for (const [k, v] of Object.entries(metadata)) {
      metaFields[k] = toFirestoreValue(v);
    }

    const scoreDoc = {
      fields: {
        gameId:      { stringValue: GAME_ID },
        score:       { integerValue: String(Math.floor(score)) },
        userId:      { stringValue: userId },
        displayName: { stringValue: displayName },
        avatar:      { stringValue: 'Guest' },
        timestamp:   { timestampValue: new Date().toISOString() },
        verified:    { booleanValue: false },
        metadata:    { mapValue: { fields: metaFields } },
      },
    };

    // ── 3. Write score to Firestore ───────────────────────
    const firestoreUrl =
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/scores`;

    const writeResp = await fetch(firestoreUrl, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(scoreDoc),
    });

    if (!writeResp.ok) {
      const errBody = await writeResp.text();
      console.error('[Scores API] Firestore write failed:', errBody);
      return NextResponse.json({ success: false, error: 'Write failed' }, { status: 500 });
    }

    // ── 4. Also update userStats (best score) ────────────
    try {
      const statsDocId  = `${userId}_${GAME_ID}`;
      const statsUrl    =
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/userStats/${statsDocId}`;

      const statsDoc = {
        fields: {
          userId:      { stringValue: userId },
          gameId:      { stringValue: GAME_ID },
          bestScore:   { integerValue: String(Math.floor(score)) },
          gamesPlayed: { integerValue: '1' },
          lastPlayed:  { timestampValue: new Date().toISOString() },
        },
      };

      // Use PATCH with updateMask so it only sets bestScore if higher
      // (For anonymous users this is always a new doc so just set it)
      await fetch(`${statsUrl}?updateMask.fieldPaths=userId&updateMask.fieldPaths=gameId&updateMask.fieldPaths=bestScore&updateMask.fieldPaths=gamesPlayed&updateMask.fieldPaths=lastPlayed`, {
        method: 'PATCH',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(statsDoc),
      });
    } catch {
      // Don't fail the whole request if stats update fails
    }

    return NextResponse.json({ success: true, userId });
  } catch (err) {
    console.error('[Scores API] Unexpected error:', err);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
