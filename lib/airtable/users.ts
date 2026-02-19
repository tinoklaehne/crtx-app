import { getBase, getField, fetchWithRetry } from "./utils";
import type { User } from "@/app/types/users";

const USERS_TABLE = "tblqIQzctIWM0SCfg";
const CURRENT_USER_ID = "recF4H1p8zeh21o5z";

function mapRecordToUser(record: any): User {
  const subscribedDomainIds =
    (getField<string[]>(record, "My_Domains") ?? []).filter(Boolean);
  const subscribedReportIds =
    (getField<string[]>(record, "My_Reports") ?? []).filter(Boolean);

  return {
    id: record.id,
    name: getField<string>(record, "Name") ?? "",
    email: getField<string>(record, "Email") ?? "",
    organisation: getField<string>(record, "Organisation") ?? undefined,
    businessUnit: getField<string>(record, "Business Unit") ?? undefined,
    domainsAccess: Boolean(getField<boolean>(record, "Domains")),
    directoryAccess: Boolean(getField<boolean>(record, "Directory")),
    radarsAccess: Boolean(getField<boolean>(record, "Radars")),
    libraryAccess: Boolean(getField<boolean>(record, "Library")),
    subscribedDomainIds,
    subscribedReportIds,
  };
}

export async function getUser(userId: string): Promise<User | null> {
  try {
    const base = getBase();
    const record = await fetchWithRetry(() => base(USERS_TABLE).find(userId));
    if (!record) return null;
    return mapRecordToUser(record);
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  // First, try to fetch by fixed ID for \"Tino Klaehne\"
  try {
    const byId = await getUser(CURRENT_USER_ID);
    if (byId) return byId;
  } catch (error) {
    console.error("Error fetching current user by ID:", error);
  }

  // Fallback: if ID lookup fails, return null so caller can decide
  return null;
}

export async function updateUser(
  userId: string,
  updates: Partial<
    Pick<
      User,
      "name" | "email" | "organisation" | "businessUnit" | "domainsAccess" | "directoryAccess" | "radarsAccess" | "libraryAccess"
    >
  >
): Promise<User | null> {
  try {
    const base = getBase();

    const fields: Record<string, any> = {};
    if (updates.name !== undefined) fields["Name"] = updates.name;
    if (updates.email !== undefined) fields["Email"] = updates.email;
    if (updates.organisation !== undefined)
      fields["Organisation"] = updates.organisation;
    if (updates.businessUnit !== undefined)
      fields["Business Unit"] = updates.businessUnit;
    if (updates.domainsAccess !== undefined)
      fields["Domains"] = updates.domainsAccess;
    if (updates.directoryAccess !== undefined)
      fields["Directory"] = updates.directoryAccess;
    if (updates.radarsAccess !== undefined)
      fields["Radars"] = updates.radarsAccess;
    if (updates.libraryAccess !== undefined)
      fields["Library"] = updates.libraryAccess;

    const [updated] = await fetchWithRetry(() =>
      base(USERS_TABLE).update([
        {
          id: userId,
          fields,
        },
      ])
    );

    return mapRecordToUser(updated);
  } catch (error) {
    console.error("Error updating user:", error);
    return null;
  }
}

export async function getSubscribedDomains(userId: string): Promise<string[]> {
  const user = await getUser(userId);
  return user?.subscribedDomainIds ?? [];
}

async function updateUserSubscriptions(
  userId: string,
  subscribedDomainIds: string[]
): Promise<string[]> {
  try {
    const base = getBase();
    const [updated] = await fetchWithRetry(() =>
      base(USERS_TABLE).update([
        {
          id: userId,
          fields: {
            My_Domains: subscribedDomainIds,
          },
        },
      ])
    );
    const user = mapRecordToUser(updated);
    return user.subscribedDomainIds;
  } catch (error) {
    console.error("Error updating user subscriptions:", error);
    return [];
  }
}

export async function subscribeToDomain(
  userId: string,
  domainId: string
): Promise<string[]> {
  const current = await getSubscribedDomains(userId);
  if (current.includes(domainId)) return current;
  const next = [...current, domainId];
  return updateUserSubscriptions(userId, next);
}

export async function unsubscribeFromDomain(
  userId: string,
  domainId: string
): Promise<string[]> {
  const current = await getSubscribedDomains(userId);
  if (!current.includes(domainId)) return current;
  const next = current.filter((id) => id !== domainId);
  return updateUserSubscriptions(userId, next);
}

export async function getSubscribedReports(userId: string): Promise<string[]> {
  const user = await getUser(userId);
  return user?.subscribedReportIds ?? [];
}

async function updateUserReportBookmarks(
  userId: string,
  subscribedReportIds: string[]
): Promise<string[]> {
  try {
    const base = getBase();
    const [updated] = await fetchWithRetry(() =>
      base(USERS_TABLE).update([
        {
          id: userId,
          fields: {
            My_Reports: subscribedReportIds,
          },
        },
      ])
    );
    const user = mapRecordToUser(updated);
    return user.subscribedReportIds;
  } catch (error) {
    console.error("Error updating user report bookmarks:", error);
    return [];
  }
}

export async function bookmarkReport(
  userId: string,
  reportId: string
): Promise<string[]> {
  const current = await getSubscribedReports(userId);
  if (current.includes(reportId)) return current;
  const next = [...current, reportId];
  return updateUserReportBookmarks(userId, next);
}

export async function unbookmarkReport(
  userId: string,
  reportId: string
): Promise<string[]> {
  const current = await getSubscribedReports(userId);
  if (!current.includes(reportId)) return current;
  const next = current.filter((id) => id !== reportId);
  return updateUserReportBookmarks(userId, next);
}

