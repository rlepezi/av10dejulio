import React from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";

// Importar todos los componentes de admin
import AdminPanel from "./AdminPanel";
import AdminMarcas from "./AdminMarcas";
import GestionEmpresas from "./GestionEmpresas";
import EditarSolicitud from "./EditarSolicitud";
import SolicitudesRegistro from "./SolicitudesRegistro";
import GestionTiposEmpresa from "./GestionTiposEmpresa";
import ListadoCampañasAdmin from "./ListadoCampañasAdmin";
import ListadoProductosAdmin from "./ListadoProductosAdmin";
import AdminSolicitudesCliente from "./AdminSolicitudesCliente";
import AdminSolicitudesComunidad from "./AdminSolicitudesComunidad";
import AdminNotificaciones from "./AdminNotificaciones";
import ListadoCategoriasAdmin from "./ListadoCategoriasAdmin";
import AdminValidacionClientes from "./AdminValidacionClientes";
import AdminDashboardStats from "./AdminDashboardStats";
import CatastroMasivo from "./CatastroMasivo";
import PanelValidacionAvanzado from "./PanelValidacionAvanzado";
import GestionAgentes from "./GestionAgentes";
import AdminSetup from "./AdminSetup";
import ReviewModerationPage from "../pages/ReviewModerationPage";
import TicketManagementPage from "../pages/TicketManagementPage";
import ResourceManager from "./ResourceManager";
import EditarEmpresaAdmin from "./EditarEmpresaAdmin";
import ListadoProveedoresAdmin from "./ListadoProveedoresAdmin";
import CrearEmpresaPublicaPage from "./CrearEmpresaPublicaPage";

// Servicios
import ServicioSeguros from "./ServicioSeguros";
import ServicioRevisionTecnica from "./ServicioRevisionTecnica";
import ServicioVulcanizaciones from "./ServicioVulcanizaciones";
import ClienteReciclaje from "./ClienteReciclaje";
import SistemaRecordatorios from "./SistemaRecordatorios";

export default function AdminLayout() {
  return (
    <DashboardLayout>
      <Routes>
        {/* Panel principal */}
        <Route index element={<AdminPanel />} />
        
        {/* Servicios - rutas específicas para admin dentro del dashboard */}
        <Route path="servicios/seguros" element={<ServicioSeguros />} />
        <Route path="servicios/revision-tecnica" element={<ServicioRevisionTecnica />} />
        <Route path="servicios/vulcanizaciones" element={<ServicioVulcanizaciones />} />
        <Route path="servicios/reciclaje" element={<ClienteReciclaje />} />
        <Route path="recordatorios" element={<SistemaRecordatorios />} />
        
        {/* Administración */}
        <Route path="empresas" element={<GestionEmpresas />} />
        <Route path="crear-empresa-publica" element={<CrearEmpresaPublicaPage />} />
        <Route path="editar-empresa/:empresaId" element={<EditarEmpresaAdmin />} />
        <Route path="editar-solicitud" element={<EditarSolicitud />} />
        <Route path="solicitudes-registro" element={<SolicitudesRegistro />} />
        <Route path="marcas" element={<AdminMarcas />} />
        <Route path="tipos-empresa" element={<GestionTiposEmpresa />} />
        <Route path="categorias" element={<ListadoCategoriasAdmin />} />
        <Route path="solicitudes-cliente" element={<AdminSolicitudesCliente />} />
        <Route path="solicitudes-comunidad" element={<AdminSolicitudesComunidad />} />
        <Route path="notificaciones" element={<AdminNotificaciones />} />
        <Route path="validacion-clientes" element={<AdminValidacionClientes />} />
        <Route path="estadisticas" element={<AdminDashboardStats />} />
        <Route path="moderacion-reseñas" element={<ReviewModerationPage />} />
        <Route path="gestion-tickets" element={<TicketManagementPage />} />
        <Route path="recursos-educativos" element={<ResourceManager />} />
        <Route path="configuracion-sistema" element={<AdminSetup />} />
        
        {/* Catastro */}
        <Route path="catastro-masivo" element={<CatastroMasivo />} />
        <Route path="panel-validacion" element={<PanelValidacionAvanzado />} />
        <Route path="agentes-campo" element={<GestionAgentes />} />
        <Route path="gestion-agentes" element={<GestionAgentes />} />
        
        {/* Gestión de campañas y productos */}
        <Route path="campañas" element={<ListadoCampañasAdmin />} />
        <Route path="productos" element={<ListadoProductosAdmin />} />
        <Route path="proveedores" element={<ListadoProveedoresAdmin />} />
      </Routes>
    </DashboardLayout>
  );
}
