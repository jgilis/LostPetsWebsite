import { getReportById } from "@/src/lib/reports";
import { parseReportFrom } from "@/src/lib/reportNavigation";
import ReportDetailClient from "./ReportDetailClient";
import ReportNotFound from "./ReportNotFound";

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const from = parseReportFrom(query.from);
  const report = await getReportById(id);

  if (!report) {
    return <ReportNotFound from={from} />;
  }

  return <ReportDetailClient report={report} from={from} />;
}
