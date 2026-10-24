import { db } from "./db";
import { headers } from "next/headers";

export interface CreateAuditLogParams {
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
}

/**
 * Filter out sensitive fields like passwords, tokens, hashes from audit snapshots
 */
function sanitize(obj: Record<string, any> | null | undefined): string | null {
  if (!obj) return null;
  const clone = { ...obj };
  const sensitiveKeys = [
    "password",
    "passwordHash",
    "token",
    "tokenHash",
    "contentBytes",
    "totpSecret",
  ];
  for (const key of sensitiveKeys) {
    if (key in clone) {
      clone[key] = "[REDACTED]";
    }
  }
  return JSON.stringify(clone);
}

/**
 * Write append-only record to AuditLog
 */
export async function logAudit(params: CreateAuditLogParams) {
  try {
    const headersList = headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = headersList.get("user-agent") ?? "unknown";

    await db.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        beforeJson: sanitize(params.before),
        afterJson: sanitize(params.after),
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Audit log creation error:", error);
  }
}
