import React, { useState } from "react";
import { request } from "../api/client";

export default function Integrations() {
  const [status, setStatus] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [oauthUrl, setOauthUrl] = useState("");
  const [integrationId, setIntegrationId] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [counterId, setCounterId] = useState("");
  const [hostId, setHostId] = useState("");
  const [topvisorProjectId, setTopvisorProjectId] = useState("");

  async function getOauth(provider) {
    try {
      const data = await request(`/integrations/${provider}/oauth/url`, {
        method: "POST",
        body: JSON.stringify({ redirect_uri: redirectUri })
      });
      setOauthUrl(data.url);
      setStatus("OAuth URL generated.");
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function saveMeta() {
    try {
      await request(`/integrations/${integrationId}`, {
        method: "PATCH",
        body: JSON.stringify({
          meta: {
            site_url: siteUrl,
            counter_id: counterId,
            host_id: hostId,
            project_id: topvisorProjectId
          }
        })
      });
      setStatus("Meta saved.");
    } catch (err) {
      setStatus(err.message);
    }
  }

  return (
    <section>
      <h1>Integrations</h1>
      <div className="card">
        <label>OAuth redirect_uri</label>
        <input value={redirectUri} onChange={(e) => setRedirectUri(e.target.value)} />
        <div className="row">
          <button onClick={() => getOauth("yandex")}>Yandex OAuth URL</button>
          <button onClick={() => getOauth("gsc")}>GSC OAuth URL</button>
        </div>
        <div className="hint">{oauthUrl}</div>
      </div>

      <div className="card">
        <label>Integration ID</label>
        <input value={integrationId} onChange={(e) => setIntegrationId(e.target.value)} />
        <label>GSC site_url</label>
        <input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} />
        <label>Metrika counter_id</label>
        <input value={counterId} onChange={(e) => setCounterId(e.target.value)} />
        <label>Webmaster host_id</label>
        <input value={hostId} onChange={(e) => setHostId(e.target.value)} />
        <label>Topvisor project_id</label>
        <input value={topvisorProjectId} onChange={(e) => setTopvisorProjectId(e.target.value)} />
        <button onClick={saveMeta}>Save integration meta</button>
      </div>

      <div className="status">{status}</div>
    </section>
  );
}
