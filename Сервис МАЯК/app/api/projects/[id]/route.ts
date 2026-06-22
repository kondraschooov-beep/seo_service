import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { deleteProject, getProject, toProjectDTO, updateProject } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  const { id } = await ctx.params;
  const project = getProject(Number(id), uid);
  if (!project) return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
  return NextResponse.json({ project: toProjectDTO(project) });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  const { id } = await ctx.params;
  const project = getProject(Number(id), uid);
  if (!project) return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
  const patch = (await req.json()) as Record<string, unknown>;
  if (typeof patch.logo === "string" && patch.logo.length > 700_000) {
    return NextResponse.json({ error: "Логотип слишком большой (до ~500 КБ)" }, { status: 400 });
  }
  updateProject(project.id, uid, patch);
  return NextResponse.json({ project: toProjectDTO(getProject(project.id, uid)!) });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  const { id } = await ctx.params;
  deleteProject(Number(id), uid);
  return NextResponse.json({ ok: true });
}
