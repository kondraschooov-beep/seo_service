// Публичный адрес сервиса для OAuth-редиректов.
// За nginx внутренний req.url == http://127.0.0.1:3000, поэтому origin из него брать нельзя.
// Приоритет: APP_URL из .env → заголовки прокси (X-Forwarded-*) → origin запроса.
export function getBaseUrl(req: Request): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto")?.split(",")[0].trim() ?? "https";
    return `${proto}://${host}`;
  }
  return new URL(req.url).origin;
}
