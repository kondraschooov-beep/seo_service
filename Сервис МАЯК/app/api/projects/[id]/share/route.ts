import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getUserId } from "@/lib/auth";
import { getProject, toProjectDTO, updateProject } from "@/lib/db";

// включить публичную ссылку (сгенерировать токен) либо отозвать её
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  const { id } = await ctx.params;
  const project = getProject(Number(id), uid);
  if (!project) return NextResponse.json({ error: "Проект не найден" }, { status: 404 });

  const token = randomBytes(18).toString("base64url");
  updateProject(project.id, uid, { shareToken: token });
  return NextResponse.json({ project: toProjectDTO(getProject(project.id, uid)!) });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  const { id } = await ctx.params;
  const project = getProject(Number(id), uid);
  if (!project) return NextResponse.json({ error: "Проект не найден" }, { status: 404 });

  updateProject(project.id, uid, { shareToken: "" });
  return NextResponse.json({ project: toProjectDTO(getProject(project.id, uid)!) });
}
