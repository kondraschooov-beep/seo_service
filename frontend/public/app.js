const apiBase = "http://127.0.0.1:8000/api/v1";

const state = {
  token: localStorage.getItem("token") || "",
};

function setStatus(msg) {
  const el = document.getElementById("status");
  el.textContent = msg;
}

function setToken(token) {
  state.token = token;
  localStorage.setItem("token", token);
  document.getElementById("token").textContent = token ? "saved" : "none";
}

async function request(path, options = {}) {
  const headers = options.headers || {};
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  headers["Content-Type"] = "application/json";

  const res = await fetch(`${apiBase}${path}`, { ...options, headers });
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

async function register() {
  const email = document.getElementById("reg_email").value;
  const password = document.getElementById("reg_password").value;
  try {
    await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setStatus("Registered. Now login.");
  } catch (err) {
    setStatus(err.message);
  }
}

async function login() {
  const email = document.getElementById("log_email").value;
  const password = document.getElementById("log_password").value;
  try {
    const data = await request("/auth/token", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.access_token);
    setStatus("Logged in.");
  } catch (err) {
    setStatus(err.message);
  }
}

async function createProject() {
  const name = document.getElementById("proj_name").value;
  const domain = document.getElementById("proj_domain").value;
  try {
    await request("/projects/", {
      method: "POST",
      body: JSON.stringify({ name, domain }),
    });
    setStatus("Project created.");
    await loadProjects();
  } catch (err) {
    setStatus(err.message);
  }
}

async function loadProjects() {
  try {
    const projects = await request("/projects/");
    const list = document.getElementById("projects");
    list.innerHTML = "";
    projects.forEach((p) => {
      const li = document.createElement("li");
      li.textContent = `${p.id}: ${p.name} (${p.domain})`;
      list.appendChild(li);
    });
  } catch (err) {
    setStatus(err.message);
  }
}

async function updateIntegrationMeta() {
  const integrationId = Number(document.getElementById("integration_id").value);
  const siteUrl = document.getElementById("gsc_site_url").value;
  const counterId = document.getElementById("metrika_counter_id").value;
  const hostId = document.getElementById("webmaster_host_id").value;
  const topvisorProjectId = document.getElementById("topvisor_project_id").value;
  try {
    await request(`/integrations/${integrationId}`, {
      method: "PATCH",
      body: JSON.stringify({
        meta: {
          site_url: siteUrl,
          counter_id: counterId,
          host_id: hostId,
          project_id: topvisorProjectId,
        },
      }),
    });
    setStatus("Integration meta updated.");
  } catch (err) {
    setStatus(err.message);
  }
}

async function generateReport() {
  const projectId = Number(document.getElementById("report_project_id").value);
  const periodStart = document.getElementById("report_start").value;
  const periodEnd = document.getElementById("report_end").value;
  try {
    const data = await request("/reports/generate", {
      method: "POST",
      body: JSON.stringify({
        project_id: projectId,
        period_start: periodStart,
        period_end: periodEnd,
      }),
    });
    setStatus(`Report queued: ${data.report_id}`);
  } catch (err) {
    setStatus(err.message);
  }
}

async function checkReport() {
  const reportId = Number(document.getElementById("report_id").value);
  try {
    const data = await request(`/reports/${reportId}`);
    setStatus(`Report ${reportId}: ${data.status}`);
  } catch (err) {
    setStatus(err.message);
  }
}

function downloadReport() {
  const reportId = Number(document.getElementById("report_id").value);
  const link = `${apiBase}/reports/${reportId}/download`;
  window.open(link, "_blank");
}

async function loadComments() {
  const reportId = Number(document.getElementById("report_id").value);
  try {
    const data = await request(`/reports/${reportId}/comments`);
    const list = document.getElementById("comments");
    list.innerHTML = "";
    data.forEach((c) => {
      const li = document.createElement("li");
      li.textContent = `${c.id} [${c.section}] ${c.text} (${c.source})`;
      list.appendChild(li);
    });
    setStatus(`Report ${reportId}: comments loaded`);
  } catch (err) {
    setStatus(err.message);
  }
}

async function updateComment() {
  const reportId = Number(document.getElementById("report_id").value);
  const commentId = Number(document.getElementById("comment_id").value);
  const text = document.getElementById("comment_text").value;
  try {
    await request(`/reports/${reportId}/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify({ text }),
    });
    setStatus("Comment updated.");
    await loadComments();
  } catch (err) {
    setStatus(err.message);
  }
}
async function reportData() {
  const reportId = Number(document.getElementById("report_id").value);
  try {
    const data = await request(`/reports/${reportId}/data`);
    document.getElementById("report_data").textContent = JSON.stringify(
      data.payload,
      null,
      2
    );
    setStatus(`Report ${reportId}: data loaded`);
  } catch (err) {
    setStatus(err.message);
  }
}

async function loadLogs() {
  const reportId = Number(document.getElementById("report_id").value);
  try {
    const logs = await request(`/reports/${reportId}/logs`);
    const list = document.getElementById("logs");
    list.innerHTML = "";
    logs.forEach((l) => {
      const li = document.createElement("li");
      li.textContent = `[${l.level}] ${l.message}`;
      list.appendChild(li);
    });
    setStatus("Logs loaded.");
  } catch (err) {
    setStatus(err.message);
  }
}
async function renderReport() {
  const reportId = Number(document.getElementById("report_id").value);
  try {
    await request(`/reports/${reportId}/render`, { method: "POST" });
    setStatus("Report re-rendered.");
  } catch (err) {
    setStatus(err.message);
  }
}

async function previewReport() {
  const reportId = Number(document.getElementById("report_id").value);
  try {
    const data = await request(`/reports/${reportId}/preview`, { method: "POST" });
    setStatus(`Preview ready: ${data.message}`);
  } catch (err) {
    setStatus(err.message);
  }
}

window.app = {
  register,
  login,
  createProject,
  loadProjects,
  updateIntegrationMeta,
  generateReport,
  checkReport,
  downloadReport,
  reportData,
  loadComments,
  updateComment,
  renderReport,
  previewReport,
  loadLogs,
};

async function getOAuthUrl(provider) {
  const redirectUri = document.getElementById("redirect_uri").value;
  try {
    const data = await request(`/integrations/${provider}/oauth/url`, {
      method: "POST",
      body: JSON.stringify({ redirect_uri: redirectUri }),
    });
    document.getElementById("oauth_url").textContent = data.url;
  } catch (err) {
    setStatus(err.message);
  }
}

window.app.getOAuthUrl = getOAuthUrl;

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("token").textContent = state.token ? "saved" : "none";
});
