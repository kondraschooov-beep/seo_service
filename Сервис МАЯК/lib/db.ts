import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import type { ProjectDTO } from "./types";

export type UserRow = {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
};

export type ProjectRow = {
  id: number;
  user_id: number;
  name: string;
  domain: string;
  logo: string;
  brand_keywords: string;
  metrika_counter_id: string;
  metrika_token: string;
  gsc_site_url: string;
  gsc_credentials: string;
  wm_host_id: string;
  wm_token: string;
  share_token: string;
  tv_token: string;
  tv_user_id: string;
  tv_project_id: string;
  tv_region_index: string;
  keysso_token: string;
  created_at: string;
};

const globalForDb = globalThis as unknown as { __db?: Database.Database };

function init(): Database.Database {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new Database(path.join(dir, "searchlight.db"));
  db.pragma("busy_timeout = 5000");
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      domain TEXT NOT NULL DEFAULT '',
      logo TEXT NOT NULL DEFAULT '',
      brand_keywords TEXT NOT NULL DEFAULT '',
      metrika_counter_id TEXT NOT NULL DEFAULT '',
      metrika_token TEXT NOT NULL DEFAULT '',
      gsc_site_url TEXT NOT NULL DEFAULT '',
      gsc_credentials TEXT NOT NULL DEFAULT '',
      wm_host_id TEXT NOT NULL DEFAULT '',
      wm_token TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  // миграции для баз, созданных до появления колонок
  for (const col of [
    "share_token TEXT NOT NULL DEFAULT ''",
    "tv_token TEXT NOT NULL DEFAULT ''",
    "tv_user_id TEXT NOT NULL DEFAULT ''",
    "tv_project_id TEXT NOT NULL DEFAULT ''",
    "tv_region_index TEXT NOT NULL DEFAULT ''",
    "keysso_token TEXT NOT NULL DEFAULT ''",
  ]) {
    try {
      db.exec(`ALTER TABLE projects ADD COLUMN ${col}`);
    } catch {
      /* колонка уже есть */
    }
  }
  return db;
}

// БД открывается лениво: при сборке Next импортирует модули в параллельных
// воркерах, и открытие на этапе импорта ловит SQLITE_BUSY
function getDb(): Database.Database {
  return globalForDb.__db ?? (globalForDb.__db = init());
}

export function toProjectDTO(p: ProjectRow): ProjectDTO {
  return {
    id: p.id,
    name: p.name,
    domain: p.domain,
    logo: p.logo,
    brandKeywords: p.brand_keywords,
    metrikaCounterId: p.metrika_counter_id,
    metrikaToken: p.metrika_token,
    gscSiteUrl: p.gsc_site_url,
    gscCredentials: p.gsc_credentials,
    wmHostId: p.wm_host_id,
    wmToken: p.wm_token,
    shareToken: p.share_token,
    tvToken: p.tv_token,
    tvUserId: p.tv_user_id,
    tvProjectId: p.tv_project_id,
    tvRegionIndex: p.tv_region_index,
    keyssoToken: p.keysso_token,
    createdAt: p.created_at,
  };
}

/** ProjectDTO без секретов — для публичной страницы отчёта */
export function toPublicProjectDTO(p: ProjectRow): ProjectDTO {
  return {
    ...toProjectDTO(p),
    brandKeywords: "",
    metrikaCounterId: "",
    metrikaToken: "",
    gscSiteUrl: "",
    gscCredentials: "",
    wmHostId: "",
    wmToken: "",
    tvToken: "",
    tvUserId: "",
    tvProjectId: "",
    tvRegionIndex: "",
    keyssoToken: "",
  };
}

export function getProjectByShareToken(token: string): ProjectRow | undefined {
  if (!token) return undefined;
  return getDb()
    .prepare("SELECT * FROM projects WHERE share_token = ? AND share_token != ''")
    .get(token) as ProjectRow | undefined;
}

export function getUserByEmail(email: string): UserRow | undefined {
  return getDb().prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow | undefined;
}

export function createUser(email: string, name: string, passwordHash: string): number {
  const r = getDb()
    .prepare("INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)")
    .run(email, name, passwordHash);
  return Number(r.lastInsertRowid);
}

export function getUserById(id: number): UserRow | undefined {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}

export function listProjects(userId: number): ProjectRow[] {
  return getDb()
    .prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as ProjectRow[];
}

export function getProject(id: number, userId: number): ProjectRow | undefined {
  return getDb()
    .prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?")
    .get(id, userId) as ProjectRow | undefined;
}

export function createProject(userId: number, name: string, domain: string, brandKeywords: string): number {
  const r = getDb()
    .prepare("INSERT INTO projects (user_id, name, domain, brand_keywords) VALUES (?, ?, ?, ?)")
    .run(userId, name, domain, brandKeywords);
  return Number(r.lastInsertRowid);
}

const PATCHABLE: Record<string, string> = {
  name: "name",
  domain: "domain",
  logo: "logo",
  brandKeywords: "brand_keywords",
  metrikaCounterId: "metrika_counter_id",
  metrikaToken: "metrika_token",
  gscSiteUrl: "gsc_site_url",
  gscCredentials: "gsc_credentials",
  wmHostId: "wm_host_id",
  wmToken: "wm_token",
  shareToken: "share_token",
  tvToken: "tv_token",
  tvUserId: "tv_user_id",
  tvProjectId: "tv_project_id",
  tvRegionIndex: "tv_region_index",
  keyssoToken: "keysso_token",
};

export function updateProject(id: number, userId: number, patch: Record<string, unknown>): void {
  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const [key, col] of Object.entries(PATCHABLE)) {
    if (typeof patch[key] === "string") {
      sets.push(`${col} = ?`);
      vals.push(patch[key]);
    }
  }
  if (!sets.length) return;
  vals.push(id, userId);
  getDb().prepare(`UPDATE projects SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`).run(...vals);
}

export function deleteProject(id: number, userId: number): void {
  getDb().prepare("DELETE FROM projects WHERE id = ? AND user_id = ?").run(id, userId);
}
