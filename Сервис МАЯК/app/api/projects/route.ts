import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { createProject, getProject, listProjects, toProjectDTO } from "@/lib/db";

export async function GET() {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  return NextResponse.json({ projects: listProjects(uid).map(toProjectDTO) });
}

export async function POST(req: Request) {
  const uid = await getUserId();
  if (!uid) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  const { name, domain, brandKeywords } = (await req.json()) as {
    name?: string;
    domain?: string;
    brandKeywords?: string;
  };
  if (!name?.trim()) return NextResponse.json({ error: "Укажите название проекта" }, { status: 400 });
  const id = createProject(uid, name.trim(), (domain ?? "").trim(), (brandKeywords ?? "").trim());
  const project = getProject(id, uid)!;
  return NextResponse.json({ project: toProjectDTO(project) });
}
