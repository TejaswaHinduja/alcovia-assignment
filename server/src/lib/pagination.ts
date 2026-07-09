/**
 * Opaque cursor helpers for keyset (cursor-based) pagination.
 *
 * The cursor encodes the (startedAt, id) of the LAST row returned in a page.
 * We page with a keyset predicate rather than OFFSET so results stay stable
 * even if rows are inserted between requests.
 */

export interface CursorPayload {
  startedAt: number;
  id: string;
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
}

export function decodeCursor(raw: string): CursorPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  } catch {
    throw new Error('Malformed cursor');
  }
  const p = parsed as Record<string, unknown>;
  if (typeof p?.startedAt !== 'number' || typeof p?.id !== 'string') {
    throw new Error('Malformed cursor');
  }
  return { startedAt: p.startedAt, id: p.id };
}
