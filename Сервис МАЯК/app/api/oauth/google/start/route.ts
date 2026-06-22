import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getProject } from "@/lib/db";
import { getBaseUrl } from "@/lib/base-url";
import { googleAuthUrl, googleConfigured, signState } from "@/lib/oauth";

export async function GET(req: Request) {
  const uid = await getUserId();
  const url = new URL(req.url);
  const base = getBaseUrl(req);
  const pid = Number(url.searchParams.get("project"));
  if (!uid) return NextResponse.redirect(new URL("/login", base));
  const project = getProject(pid, uid);
  if (!project) return NextResponse.redirect(new URL("/projects", base));
  if (!googleConfigured()) {
    return NextResponse.redirect(
      new URL(`/p/${pid}/settings?oauth_error=${encodeURIComponent("Не заданы GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET в .env")}`, base)
    );
  }
  const state = await signState(uid, pid);
  return NextResponse.redirect(googleAuthUrl(`${base}/api/oauth/google/callback`, state));
}
