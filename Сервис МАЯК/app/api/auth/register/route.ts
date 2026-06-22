import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password, name } = (await req.json()) as {
    email?: string;
    password?: string;
    name?: string;
  };
  const cleanEmail = (email ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    return NextResponse.json({ error: "Некорректный e-mail" }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Пароль — минимум 6 символов" }, { status: 400 });
  }
  if (getUserByEmail(cleanEmail)) {
    return NextResponse.json({ error: "Пользователь с таким e-mail уже есть" }, { status: 409 });
  }
  const id = createUser(cleanEmail, (name ?? "").trim(), bcrypt.hashSync(password, 10));
  await createSession(id);
  return NextResponse.json({ ok: true });
}
