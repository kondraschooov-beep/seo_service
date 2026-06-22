import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { listProjects, toProjectDTO } from "@/lib/db";
import { Masthead } from "@/components/masthead";
import { ProjectsView } from "@/components/projects-view";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const uid = await getUserId();
  if (!uid) redirect("/login");
  const projects = listProjects(uid).map(toProjectDTO);

  return (
    <>
      <Masthead />
      <ProjectsView initial={projects} />
    </>
  );
}
