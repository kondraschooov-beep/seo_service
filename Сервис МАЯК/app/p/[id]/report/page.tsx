import { notFound, redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { getProject, toProjectDTO } from "@/lib/db";
import { Report } from "@/components/report";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const { id } = await params;
  const project = getProject(Number(id), uid);
  if (!project) notFound();

  return <Report project={toProjectDTO(project)} />;
}
