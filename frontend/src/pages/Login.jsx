import React, { useState } from "react";
import { request, getToken, API_BASE } from "../api/client";
import { useAuth } from "../auth.jsx";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [status, setStatus] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setToken } = useAuth();
  const navigate = useNavigate();

  async function register() {
    try {
      await request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setStatus("Registered. Now login.");
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function login() {
    try {
      const data = await request("/auth/token", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setToken(data.access_token);
      setStatus("Logged in.");
      navigate("/projects");
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function testApi() {
    try {
      const res = await fetch(API_BASE.replace("/api/v1", "") + "/health");
      const text = await res.text();
      setStatus(`API OK: ${text}`);
    } catch (err) {
      setStatus(`API error: ${err.message}`);
    }
  }

  return (
    <section>
      <h1>Login</h1>
      <div className="card">
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="row">
          <button onClick={register}>Register</button>
          <button onClick={login}>Login</button>
          <button onClick={testApi}>Test API</button>
        </div>
        <div className="hint">Token: {getToken() ? "saved" : "none"}</div>
        <div className="hint">API: {API_BASE}</div>
        <div className="status">{status}</div>
      </div>
    </section>
  );
}
