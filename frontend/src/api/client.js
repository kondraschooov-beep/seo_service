export const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api/v1";

export function getToken() {
  return localStorage.getItem("token") || "";
}

export function setToken(token) {
  localStorage.setItem("token", token || "");
}

export async function request(path, options = {}) {
  const headers = options.headers || {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(data?.detail || "Request failed");
  }
  return data;
}
