import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/airtable/users";
import { getDomainContent, getDomain } from "@/lib/airtable/domains";
import type { DomainContentItem } from "@/app/types/domainContent";

export const dynamic = "force-static";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.subscribedDomainIds.length === 0) {
      return NextResponse.json({ items: [], domainNames: {} });
    }

    const domainIds = user.subscribedDomainIds;

    const [contents, domains] = await Promise.all([
      Promise.all(domainIds.map((id) => getDomainContent(id))),
      Promise.all(domainIds.map((id) => getDomain(id))),
    ]);

    const domainNames: Record<string, string> = {};
    domains.forEach((domain, index) => {
      if (domain) {
        domainNames[domain.id] = domain.name;
      } else {
        const id = domainIds[index];
        if (id && !domainNames[id]) {
          domainNames[id] = id;
        }
      }
    });

    const aggregated: DomainContentItem[] = [];

    contents.forEach((content, index) => {
      const domainId = domainIds[index];
      const domainName = domainNames[domainId];

      content.now.forEach((item) => {
        aggregated.push({
          ...item,
          metadata: {
            ...(item.metadata ?? {}),
            domainId,
            domainName,
          },
        });
      });
    });

    aggregated.sort((a, b) => {
      const aTime = a.date ? new Date(a.date).getTime() : 0;
      const bTime = b.date ? new Date(b.date).getTime() : 0;
      return bTime - aTime;
    });

    const newest50 = aggregated.slice(0, 50);
    return NextResponse.json({ items: newest50, domainNames });
  } catch (error) {
    console.error("Error in /api/user/my-domains-signals GET:", error);
    // Always return 200 with empty data on error so UI doesn't break
    return NextResponse.json({ items: [], domainNames: {}, error: true });
  }
}

