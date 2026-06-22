import React, { useState } from "react";
import { request } from "../api/client";

export default function Projects() {
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [projects, setProjects] = useState([]);

  async function loadProjects() {
    try {
      const data = await request("/projects/");
      setProjects(data);
      setStatus("Loaded.");
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function createProject() {
    try {
      await request("/projects/", {
        method: "POST",
        body: JSON.stringify({ name, domain })
      });
      setStatus("Created.");
      await loadProjects();
    } catch (err) {
      setStatus(err.message);
    }
  }

  return (
    <section>
      <h1>Projects</h1>
      <div className="card">
        <label>Project name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <label>Domain</label>
        <input value={domain} onChange={(e) => setDomain(e.target.value)} />
        <div className="row">
          <button onClick={createProject}>Create</button>
          <button onClick={loadProjects}>Refresh</button>
        </div>
        <ul className="list">
          {projects.map((p) => (
            <li key={p.id}>{p.id}: {p.name} ({p.domain})</li>
          ))}
        </ul>
        <div className="status">{status}</div>
      </div>
    </section>
  );
}
