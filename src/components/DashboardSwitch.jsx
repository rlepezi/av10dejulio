import React, { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { useNavigate } from "react-router-dom";

export default function DashboardSwitch() {
  const { user, rol } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (rol === "admin") {
      navigate("/admin");
    } else if (rol === "proveedor") {
      navigate("/dashboard/proveedor");
    } else {
      navigate("/");
    }
  }, [user, rol, navigate]);

  return <div>Cargando dashboard...</div>;
}