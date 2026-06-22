import React, { useEffect, useState } from "react";
import { request } from "../api/client";

export default function Reports() {
  const [status, setStatus] = useState("");
  const [projectId, setProjectId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [reportId, setReportId] = useState("");
  const [comments, setComments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [dataPayload, setDataPayload] = useState("{}");
  const [commentId, setCommentId] = useState("");
  const [commentText, setCommentText] = useState("");
  const [previewBlob, setPreviewBlob] = useState("");
  useEffect(() => {
    return () => {
      if (previewBlob) URL.revokeObjectURL(previewBlob);
    };
  }, [previewBlob]);
  const apiBase = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api/v1";

  async function generate() {
    try {
      const data = await request("/reports/generate", {
        method: "POST",
        body: JSON.stringify({
          project_id: Number(projectId),
          period_start: periodStart,
          period_end: periodEnd
        })
      });
      setReportId(String(data.report_id));
      setStatus(`Queued: ${data.report_id}`);
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function check() {
    try {
      const data = await request(`/reports/${reportId}`);
      setStatus(`Status: ${data.status}`);
    } catch (err) {
      setStatus(err.message);
    }
  }

  function download() {
    const url = `${apiBase}/reports/${reportId}/download`;
    window.open(url, "_blank");
  }

  async function preview() {
    try {
      await request(`/reports/${reportId}/preview`, { method: "POST" });
      const res = await fetch(`${apiBase}/reports/${reportId}/preview/download`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewBlob(url);
      setStatus("Preview ready.");
    } catch (err) {
      setStatus(err.message);
    }
  }

  const previewUrl = previewBlob;

  async function renderFinal() {
    try {
      await request(`/reports/${reportId}/render`, { method: "POST" });
      setStatus("Final rendered.");
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function loadData() {
    try {
      const data = await request(`/reports/${reportId}/data`);
      setDataPayload(JSON.stringify(data.payload, null, 2));
      setStatus("Data loaded.");
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function loadComments() {
    try {
      const data = await request(`/reports/${reportId}/comments`);
      setComments(data);
      setStatus("Comments loaded.");
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function updateComment() {
    try {
      await request(`/reports/${reportId}/comments/${commentId}`, {
        method: "PUT",
        body: JSON.stringify({ text: commentText })
      });
      setStatus("Comment updated.");
      await loadComments();
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function loadLogs() {
    try {
      const data = await request(`/reports/${reportId}/logs`);
      setLogs(data);
      setStatus("Logs loaded.");
    } catch (err) {
      setStatus(err.message);
    }
  }

  return (
    <section>
      <h1>Reports</h1>
      <div className="card">
        <label>Project ID</label>
        <input value={projectId} onChange={(e) => setProjectId(e.target.value)} />
        <label>Period start (YYYY-MM-DD)</label>
        <input value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
        <label>Period end (YYYY-MM-DD)</label>
        <input value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
        <button onClick={generate}>Generate report</button>
      </div>

      <div className="card">
        <label>Report ID</label>
        <input value={reportId} onChange={(e) => setReportId(e.target.value)} />
        <div className="row">
          <button onClick={check}>Check</button>
          <button onClick={preview}>Preview</button>
          <button onClick={renderFinal}>Render</button>
          <button onClick={download}>Download</button>
        </div>
      </div>

      {previewUrl && (
        <div className="card">
          <h3>Preview</h3>
          <iframe title="preview" src={previewUrl} className="preview-frame" />
        </div>
      )}

      <div className="card">
        <h3>Data</h3>
        <button onClick={loadData}>Load data</button>
        <pre className="pre">{dataPayload}</pre>
      </div>

      <div className="card">
        <h3>Comments</h3>
        <button onClick={loadComments}>Load comments</button>
        <ul className="list">
          {comments.map((c) => (
            <li key={c.id}>#{c.id} [{c.section}] {c.text} ({c.source})</li>
          ))}
        </ul>
        <div className="row">
          <input placeholder="Comment ID" value={commentId} onChange={(e) => setCommentId(e.target.value)} />
          <input placeholder="New text" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
        </div>
        <button onClick={updateComment}>Update comment</button>
      </div>

      <div className="card">
        <h3>Logs</h3>
        <button onClick={loadLogs}>Load logs</button>
        <ul className="list">
          {logs.map((l) => (
            <li key={l.id}>[{l.level}] {l.message}</li>
          ))}
        </ul>
      </div>

      <div className="status">{status}</div>
    </section>
  );
}
