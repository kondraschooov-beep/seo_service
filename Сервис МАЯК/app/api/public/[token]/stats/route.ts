import { NextResponse } from "next/server";
import { getProjectByShareToken } from "@/lib/db";
import { assembleDashboard } from "@/lib/stats";

// публичная статистика по share-токену — без авторизации, только чтение
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const project = getProjectByShareToken(token);
  if (!project) return NextResponse.json({ error: "Отчёт не найден" }, { status: 404 });

  const daysParam = Number(new URL(req.url).searchParams.get("days") ?? 30);
  const days = [7, 30, 90].includes(daysParam) ? daysParam : 30;

  const data = await assembleDashboard(project, days);
  return NextResponse.json(data);
}
