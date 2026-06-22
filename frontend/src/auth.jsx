import React, { createContext, useContext, useMemo, useState } from "react";
import { getToken, setToken } from "./api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());

  const value = useMemo(() => ({
    token,
    setToken: (t) => {
      setTokenState(t || "");
      setToken(t || "");
    }
  }), [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
