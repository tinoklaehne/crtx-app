import { getDomain, getDomainContent, getDomainIds, getDomainTrends, getAllDomains } from "@/lib/airtable/domains";
import { getReportsByDomain } from "@/lib/airtable/reports";
import { getDomainStrategy } from "@/lib/airtable/strategy";
import { DomainDetailPage } from "@/app/components/DomainDetailPage";
import { notFound } from "next/navigation";
import { getBase, getField, normalizeDomain, fetchWithRetry } from "@/lib/airtable/utils";
import type { Trend } from "@/app/types/trends";
import type { Cluster } from "@/app/types/clusters";
import type { Domain } from "@/app/types/domains";

const TRENDS_TABLE = 'tblZ683rmMtm6BkyL';

// Helper function to fetch parent clusters by their IDs
async function fetchParentClustersByIds(clusterIds: string[]): Promise<Cluster[]> {
  if (!clusterIds || clusterIds.length === 0) return [];
  
  try {
    const base = getBase();
    console.log(`Fetching ${clusterIds.length} parent clusters by IDs`);
    
    const records = await Promise.all(
      clusterIds.map((id) => 
        fetchWithRetry(() => base(TRENDS_TABLE).find(id))
          .catch((error) => {
            console.error(`Failed to fetch parent cluster ${id}:`, error);
            return null;
          })
      )
    );
    
    const successfulRecords = records.filter(record => record !== null);
    console.log(`Successfully fetched ${successfulRecords.length} of ${clusterIds.length} parent clusters`);
    
    return successfulRecords.map(record => ({
      id: record!.id,
      name: getField(record!, 'Name') || '',
      description: getField(record!, 'Description') || '',
      imageUrl: getField(record!, 'ImageUrl') || '',
      image: getField(record!, 'Image') || [],
      colorCode: getField(record!, 'ColorCode') || '#00ff80',
      domain: normalizeDomain(getField(record!, 'Domain') ?? 'Technology') as Domain,
      universe: getField(record!, 'Universe') || 'General',
      trends: [],
      technologies: [],
    }));
  } catch (error: any) {
    console.error('Error fetching parent clusters by IDs:', error);
    return [];
  }
}

export const revalidate = 3600;

// On Vercel: return [] so domain pages are rendered on-demand (avoids build timeouts and single-domain failures).
// For static export (non-Vercel): return one placeholder so the route is valid.
export async function generateStaticParams() {
  if (process.env.VERCEL) return [];
  try {
    const domainIds = await getDomainIds();
    if (domainIds.length > 0) {
      console.log(`Generated static params for ${domainIds.length} domains`);
      return domainIds.map((id) => ({ domainId: id }));
    }
    return [];
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export default async function DomainDetailRoute({
  params,
}: {
  params: Promise<{ domainId: string }>;
}) {
  // Await params to fix Next.js 15 compatibility
  const { domainId } = await params;

  // Fetch domain, content, trends data, all domains, reports, and strategy in parallel
  const [domain, content, trendsData, allDomains, reports, strategy] = await Promise.all([
    getDomain(domainId).catch(err => {
      console.error("Failed to fetch domain:", err);
      return null;
    }),
    getDomainContent(domainId).catch(err => {
      console.error("Failed to fetch domain content:", err);
      return {
        now: [],
        new: [],
        next: [],
      };
    }),
    getDomainTrends(domainId).catch(err => {
      console.error("Failed to fetch domain trends:", err);
      return { trends: [], parentClusterIds: [] };
    }),
    getAllDomains().catch(err => {
      console.error("Failed to fetch all domains:", err);
      return [];
    }),
    getReportsByDomain(domainId).catch(err => {
      console.error("Failed to fetch reports:", err);
      return [];
    }),
    getDomainStrategy(domainId).catch(err => {
      console.error("Failed to fetch domain strategy:", err);
      return { themes: [], questions: [], problems: [] };
    }),
  ]);
  
  const { trends, parentClusterIds } = trendsData;
  
  // Fetch parent clusters by their IDs (more efficient than fetching all clusters)
  const clusters = await fetchParentClustersByIds(parentClusterIds).catch(err => {
    console.error("Failed to fetch parent clusters by IDs:", err);
    return [];
  });

  if (!domain) {
    notFound();
  }

  // Clusters are already fetched using parentClusterIds from getDomainTrends
  // This ensures we have all parent clusters referenced by trends' REL_Trends fields

  // Trends already have their clusterId set from getDomainTrends (first parent from REL_Trends)
  // Clusters are fetched based on ALL parent cluster IDs found in REL_Trends arrays

  console.log(`Domain ${domainId}: Using ${clusters.length} parent clusters from ${trends.length} trends`);
  console.log(`Parent cluster IDs found:`, parentClusterIds);
  console.log(`Cluster IDs fetched:`, clusters.map(c => c.id));
  console.log(`Sample trend clusterIds:`, trends.slice(0, 5).map(t => ({ name: t.name, clusterId: t.clusterId, domain: t.domain })));

  const subAreaDomains = allDomains.filter(d => (d.hierarchy || '').trim() === 'Sub-Area');
  const arenaNames = Object.fromEntries(
    (allDomains || []).map((d) => [d.id, d.name ?? ""])
  );
  return <DomainDetailPage domain={domain} content={content} trends={trends} clusters={clusters} allDomains={subAreaDomains} arenaNames={arenaNames} reports={reports} strategy={strategy} />;
}
