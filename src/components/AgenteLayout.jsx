import React from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import PanelAgente from "./PanelAgente";

export default function AgenteLayout() {
  return (
    <DashboardLayout>
      <Routes>
        {/* Panel principal del agente */}
        <Route index element={<PanelAgente />} />
        <Route path="*" element={<PanelAgente />} />
      </Routes>
    </DashboardLayout>
  );
}
