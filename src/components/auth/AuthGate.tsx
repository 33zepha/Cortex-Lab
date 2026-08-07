import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getSession } from "@/lib/auth";

export function AuthGate() {
  const location = useLocation();
  const [state, setState] = useState<"checking" | "authenticated" | "anonymous">("checking");

  useEffect(() => {
    let active = true;
    getSession()
      .then((session) => { if (active) setState(session ? "authenticated" : "anonymous"); })
      .catch(() => { if (active) setState("anonymous"); });
    return () => { active = false; };
  }, []);

  if (state === "checking") {
    return <div style={{ minHeight: "100dvh", background: "#121713" }} aria-label="Checking Cortex session" />;
  }

  if (state === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
