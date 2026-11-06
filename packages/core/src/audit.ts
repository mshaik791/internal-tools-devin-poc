export interface AuditEntry {
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
  requestId: string;
}

/**
 * Minimal surface of a Prisma client or interactive-transaction client.
 * Pass the transaction client so the audit row commits atomically with the mutation.
 */
export interface AuditWriter {
  $executeRawUnsafe(query: string, ...values: unknown[]): PromiseLike<number>;
}

// Plain INSERT without RETURNING: the app role has no UPDATE/DELETE on audit_log.
const INSERT_SQL = `INSERT INTO audit_log (actor, action, entity, entity_id, before, after, reason, request_id)
VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8)`;

const toJson = (v: unknown) => (v === undefined || v === null ? null : JSON.stringify(v));

/** Appends exactly one row to audit_log. */
export async function audit(entry: AuditEntry, db: AuditWriter): Promise<void> {
  for (const key of ["actor", "action", "entity", "entityId", "requestId"] as const) {
    if (!entry[key]?.trim()) throw new Error(`audit: ${key} is required`);
  }
  const rows = await db.$executeRawUnsafe(
    INSERT_SQL,
    entry.actor,
    entry.action,
    entry.entity,
    entry.entityId,
    toJson(entry.before),
    toJson(entry.after),
    entry.reason ?? null,
    entry.requestId,
  );
  if (rows !== 1) throw new Error(`audit: expected 1 row inserted, got ${rows}`);
}
