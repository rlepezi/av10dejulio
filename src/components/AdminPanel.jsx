import React, { useState } from "react";
import AdminStoreList from "./AdminStoreList";
import CampaignList from "./CampaignList";
import CampaignForm from "./CampaignForm";

function AdminPanel({ user }) {
  const [tab, setTab] = useState("empresas");
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Panel de Administración</h1>
      <div className="flex gap-4 mb-4">
        <button className={`px-4 py-2 ${tab === "empresas" ? "bg-blue-500 text-white" : "bg-gray-200"}`} onClick={() => setTab("empresas")}>Empresas</button>
        <button className={`px-4 py-2 ${tab === "campañas" ? "bg-blue-500 text-white" : "bg-gray-200"}`} onClick={() => setTab("campañas")}>Campañas</button>
      </div>
      {tab === "empresas" && <AdminStoreList />}
      {tab === "campañas" && (
        <>
          <CampaignForm />
          <CampaignList />
        </>
      )}
    </div>
  );
}

export default AdminPanel;