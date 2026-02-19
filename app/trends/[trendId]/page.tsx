import { getTrend, getClusters, getAllTrends } from "@/lib/airtable/general";
import { TrendDetailPage } from "@/app/components/trends/TrendDetailPage";
import { Navbar } from "@/app/components/layout/Navbar";
import { TrendsSidepanel } from "@/app/components/trends/TrendsSidepanel";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export async function generateStaticParams() {
  if (process.env.VERCEL) return [];
  try {
    const trends = await getAllTrends();
    if (trends.length > 0) {
      console.log(`Generated static params for ${trends.length} trends`);
      return trends.map((trend) => ({ trendId: trend.id }));
    }
    return [];
  } catch (error) {
    console.error("Error generating static params for trends:", error);
    return [];
  }
}

export default async function TrendDetailRoute({
  params,
}: {
  params: Promise<{ trendId: string }>;
}) {
  const { trendId } = await params;
  const [trend, clusters, allTrends] = await Promise.all([
    getTrend(trendId),
    getClusters("parent"),
    getAllTrends(),
  ]);
  if (!trend) notFound();
  const cluster = clusters.find((c) => c.id === trend.clusterId);
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Navbar />
      <TrendsSidepanel trends={allTrends} />
      <div className="flex-1 overflow-auto">
        <TrendDetailPage trend={trend} cluster={cluster} signals={[]} />
      </div>
    </div>
  );
}
