import React from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Projects from "./pages/Projects.jsx";
import Integrations from "./pages/Integrations.jsx";
import Reports from "./pages/Reports.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import { useAuth } from "./auth.jsx";

export default function App() {
  const { token, setToken } = useAuth();
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">SEOSmartReport</div>
        {token && (
          <button className="ghost" onClick={() => setToken("")}>Logout</button>
        )}
        <nav>
          <NavLink to="/" end>Login</NavLink>
          <NavLink to="/projects">Projects</NavLink>
          <NavLink to="/integrations">Integrations</NavLink>
          <NavLink to="/reports">Reports</NavLink>
        </nav>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/projects"
            element={<ProtectedRoute><Projects /></ProtectedRoute>}
          />
          <Route
            path="/integrations"
            element={<ProtectedRoute><Integrations /></ProtectedRoute>}
          />
          <Route
            path="/reports"
            element={<ProtectedRoute><Reports /></ProtectedRoute>}
          />
        </Routes>
      </main>
    </div>
  );
}
