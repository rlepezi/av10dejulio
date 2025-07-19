import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Componentes de proveedor/empresa
import PostularEmpresaPage from '../components/PostularEmpresaPage';
import RegistroProveedor from '../components/RegistroProveedor';
import DashboardProveedorMejorado from '../components/DashboardProveedorMejorado';
import MiEmpresaPage from '../components/MiEmpresaPage';
import SolicitudCampanaPage from '../components/SolicitudCampanaPage';
import SolicitudProductoPage from '../components/SolicitudProductoPage';
import EditarCampanaPage from '../components/EditarCampanaPage';
import EditarProductoPage from '../components/EditarProductoPage';

const ProviderRoutes = () => {
  return (
    <Routes>
      {/* Rutas públicas de registro */}
      <Route path="/registrar-empresa" element={<PostularEmpresaPage />} />
      <Route path="/registro-proveedor" element={<RegistroProveedor />} />
      <Route path="/registro-pyme" element={<RegistroProveedor />} />
      
      {/* Rutas protegidas de proveedor */}
      <Route
        path="/proveedor"
        element={
          <ProtectedRoute>
            <DashboardProveedorMejorado />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/proveedor/mi-empresa"
        element={
          <ProtectedRoute>
            <MiEmpresaPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/proveedor/solicitar-campana"
        element={
          <ProtectedRoute>
            <SolicitudCampanaPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/proveedor/solicitar-producto"
        element={
          <ProtectedRoute>
            <SolicitudProductoPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/proveedor/editar-campana/:id"
        element={
          <ProtectedRoute>
            <EditarCampanaPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/proveedor/editar-producto/:id"
        element={
          <ProtectedRoute>
            <EditarProductoPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default ProviderRoutes;
