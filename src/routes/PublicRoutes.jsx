import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Páginas públicas
import HomePage from '../pages/HomePage';
import TestRegistroEmpresaPage from '../pages/TestRegistroEmpresaPage';
import LoginPage from '../components/LoginPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import ContactPage from '../pages/ContactPage';
import EducationalResourcesPage from '../pages/EducationalResourcesPage';
import ResourceDetailPage from '../pages/ResourceDetailPage';
import FAQPage from '../pages/FAQPage';
import LocalProvidersPage from '../pages/LocalProvidersPage';
import MasInformacionProveedorPage from '../pages/MasInformacionProveedorPage';
import UserTicketsPage from '../pages/UserTicketsPage';
import PerfilEmpresaPublica from '../pages/PerfilEmpresaPublica';
import PerfilEmpresaPublico from '../pages/PerfilEmpresaPublico';
import ActualizarEmpresaTemp from '../components/ActualizarEmpresaTemp';

// Servicios públicos
import ServicioSeguros from '../components/ServicioSeguros';
import ServicioRevisionTecnica from '../components/ServicioRevisionTecnica';
import ServicioVulcanizaciones from '../components/ServicioVulcanizaciones';
import DashboardReciclaje from '../components/DashboardReciclaje';
import ClienteReciclaje from '../components/ClienteReciclaje';

// Solicitudes públicas
import SolicitudComunidad from '../components/SolicitudComunidad';

const PublicRoutes = () => {
  return (
    <Routes>
      {/* Página principal */}
      <Route path="/" element={<HomePage />} />
      
      {/* Autenticación */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Productos y servicios */}
      <Route path="/productos" element={<ProductDetailPage />} />
      <Route path="/productos/:id" element={<ProductDetailPage />} />
      
      {/* Servicios públicos */}
      <Route path="/servicios/seguros" element={<ServicioSeguros />} />
      <Route path="/servicios/revision-tecnica" element={<ServicioRevisionTecnica />} />
      <Route path="/servicios/vulcanizaciones" element={<ServicioVulcanizaciones />} />
      <Route path="/servicios/reciclaje" element={<DashboardReciclaje />} />
      <Route path="/cliente-reciclaje" element={<ClienteReciclaje />} />
      
      {/* Información y soporte */}
      <Route path="/contacto" element={<ContactPage />} />
      <Route path="/recursos-educativos" element={<EducationalResourcesPage />} />
      <Route path="/recursos/:id" element={<ResourceDetailPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/mis-tickets" element={<UserTicketsPage />} />
      
      {/* Proveedores */}
      <Route path="/proveedores-locales" element={<LocalProvidersPage />} />
      <Route path="/proveedor/:id" element={<MasInformacionProveedorPage />} />
      
      {/* Perfil público de empresas */}
      <Route path="/perfil-empresa/:empresaId" element={<PerfilEmpresaPublica />} />
      <Route path="/empresa/:empresaId" element={<PerfilEmpresaPublico />} />
      
      {/* Solicitudes públicas */}
      <Route path="/solicitud-comunidad" element={<SolicitudComunidad />} />
      
      {/* Ruta temporal para actualizar empresa */}
      <Route path="/temp-update" element={<ActualizarEmpresaTemp />} />
      {/* Ruta de prueba para formulario validado */}
      <Route path="/test-registro-empresa" element={<TestRegistroEmpresaPage />} />
    </Routes>
  );
};

export default PublicRoutes;
