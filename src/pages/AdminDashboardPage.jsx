import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import AdminStats from "../components/AdminStats";
import EmpresasTable from "../components/EmpresasTable";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  return (
    <DashboardLayout>
      <AdminStats />
      <div className="mb-6">
        <button
          className="bg-green-700 text-white px-4 py-2 rounded"
          onClick={() => navigate("/admin/proveedores/nuevo-proveedor")}
        >
          Ingresar Proveedor
        </button>
      </div>
      <EmpresasTable />
    </DashboardLayout>
  );
}