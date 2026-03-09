import { fetchWithRetry, getBase, getField } from "./utils";

const ACTIONS_TABLE = "tblA0KRyRnM763cXy";

export const ACTION_VISIBLE_STATUSES = new Set(["Auto", "Checked"]);
export const ACTION_MUTABLE_STATUSES = new Set([
  "Auto",
  "Checked",
  "Noise",
  "Delete",
]);

function normalizeStatus(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  return String(value).trim();
}

export function isVisibleActionStatus(status: unknown): boolean {
  return ACTION_VISIBLE_STATUSES.has(normalizeStatus(status));
}

export function isAllowedActionStatus(status: unknown): boolean {
  return ACTION_MUTABLE_STATUSES.has(normalizeStatus(status));
}

export async function updateActionStatus(
  actionId: string,
  status: string
): Promise<string | null> {
  if (!actionId || !isAllowedActionStatus(status)) return null;
  try {
    const base = getBase();
    const table = base(ACTIONS_TABLE) as {
      update: (
        records: { id: string; fields: Record<string, unknown> }[]
      ) => Promise<unknown>;
    };
    const result = await fetchWithRetry(() =>
      table.update([{ id: actionId, fields: { Status: status } }])
    );
    const updated = Array.isArray(result) ? result[0] : result;
    return normalizeStatus(getField<string>(updated as any, "Status")) || status;
  } catch (error) {
    console.error("Error updating action status:", error);
    return null;
  }
}
