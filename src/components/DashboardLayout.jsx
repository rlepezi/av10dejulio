import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuth } from "./AuthProvider";

export default function DashboardLayout({ children }) {
  const { rol } = useAuth();
  return (
    <div className="flex min-h-screen">
      <Sidebar rol={rol} />
      <div className="flex-1 flex flex-col bg-blue-50">
        <Topbar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}