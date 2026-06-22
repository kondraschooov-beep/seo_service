import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getProject } from "@/lib/db";
import { listTopvisorProjects } from "@/lib/positions";

// список проектов аккаунта Топвизора — чтобы выбрать нужный в настройках
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  const { id } = await ctx.params;
  const project = getProject(Number(id), uid);
  if (!project) return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
  if (!project.tv_token || !project.tv_user_id) {
    return NextResponse.json({ projects: [] });
  }
  try {
    const projects = await listTopvisorProjects(project.tv_token, project.tv_user_id);
    return NextResponse.json({ projects });
  } catch (e) {
    return NextResponse.json({ projects: [], error: e instanceof Error ? e.message : String(e) });
  }
}
