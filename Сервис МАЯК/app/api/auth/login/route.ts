import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = (await req.json()) as { email?: string; password?: string };
  const user = getUserByEmail((email ?? "").trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password ?? "", user.password_hash)) {
    return NextResponse.json({ error: "Неверный e-mail или пароль" }, { status: 401 });
  }
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
