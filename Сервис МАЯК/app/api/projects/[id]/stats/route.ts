import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getProject } from "@/lib/db";
import { assembleDashboard } from "@/lib/stats";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  const { id } = await ctx.params;
  const project = getProject(Number(id), uid);
  if (!project) return NextResponse.json({ error: "Проект не найден" }, { status: 404 });

  const daysParam = Number(new URL(req.url).searchParams.get("days") ?? 30);
  const days = [7, 30, 90].includes(daysParam) ? daysParam : 30;

  const data = await assembleDashboard(project, days);
  return NextResponse.json(data);
}
