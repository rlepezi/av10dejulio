import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileHeader from "./MobileHeader";
import { useAuth } from "./AuthProvider";

export default function DashboardLayout({ children }) {
  const { rol } = useAuth();
  return (
    <>
      {/* Header móvil (solo visible en móvil) */}
      <div className="md:hidden">
        <MobileHeader />
      </div>
      
      {/* Layout desktop */}
      <div className="flex min-h-screen">
        <div className="hidden md:block">
          <Sidebar rol={rol} />
        </div>
        <div className="flex-1 flex flex-col bg-blue-50">
          <div className="hidden md:block">
            <Topbar />
          </div>
          <main className="flex-1 p-4 md:p-8 pt-4 md:pt-8">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}