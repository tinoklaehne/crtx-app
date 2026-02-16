import { getReport, getAllReports } from "@/lib/airtable/reports";
import { getAllDomains } from "@/lib/airtable/domains";
import { ReportDetailPage } from "@/app/components/ReportDetailPage";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export async function generateStaticParams() {
  if (process.env.VERCEL) return [];
  try {
    const reports = await getAllReports();
    if (reports.length > 0) {
      console.log(`Generated static params for ${reports.length} reports`);
      return reports.map((report) => ({ reportId: report.id }));
    }
    return [];
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export default async function ReportDetailRoute({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;

  const [report, allReports, allDomains] = await Promise.all([
    getReport(reportId).catch((err) => {
      console.error("Failed to fetch report:", err);
      return null;
    }),
    getAllReports().catch(() => []),
    getAllDomains().catch(() => []),
  ]);

  if (!report) {
    notFound();
  }

  // Build domain names map for Sub-Area resolution
  const domainNames = Object.fromEntries(
    (allDomains || []).map((d) => [d.id, d.name ?? ""])
  );

  return (
    <ReportDetailPage
      report={report}
      domainNames={domainNames}
      allReports={allReports}
    />
  );
}
