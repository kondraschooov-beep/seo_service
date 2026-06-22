import { notFound } from "next/navigation";
import { getProjectByShareToken, toPublicProjectDTO } from "@/lib/db";
import { Report } from "@/components/report";

export const dynamic = "force-dynamic";

export default async function PublicReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const project = getProjectByShareToken(token);
  if (!project) notFound();

  return <Report project={toPublicProjectDTO(project)} statsBase={`/api/public/${token}/stats`} publicMode />;
}
