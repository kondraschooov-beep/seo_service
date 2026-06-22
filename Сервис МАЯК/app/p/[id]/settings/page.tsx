import { notFound, redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { getProject, toProjectDTO } from "@/lib/db";
import { Masthead } from "@/components/masthead";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const { id } = await params;
  const project = getProject(Number(id), uid);
  if (!project) notFound();

  return (
    <>
      <Masthead />
      <SettingsForm initial={toProjectDTO(project)} />
    </>
  );
}
