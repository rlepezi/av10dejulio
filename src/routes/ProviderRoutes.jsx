import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Componentes de empresa
import PostularEmpresaPage from '../components/PostularEmpresaPage';
import RegistroEmpresa from '../components/RegistroEmpresa';
import DashboardEmpresa from '../components/DashboardEmpresa';
import MiEmpresaPage from '../components/MiEmpresaPage';
import SolicitudCampanaPage from '../components/SolicitudCampanaPage';
import SolicitudProductoPage from '../components/SolicitudProductoPage';
import EditarCampanaPage from '../components/EditarCampanaPage';
import EditarProductoPage from '../components/EditarProductoPage';

const EmpresaRoutes = () => {
  return (
    <Routes>
      {/* Rutas públicas de registro */}
      <Route path="/registrar-empresa" element={<PostularEmpresaPage />} />
      <Route path="/registro-empresa" element={<RegistroEmpresa />} />
      
      {/* Rutas protegidas de empresa */}
      <Route
        path="/empresa"
        element={
          <ProtectedRoute>
            <DashboardEmpresa />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/empresa/mi-empresa"
        element={
          <ProtectedRoute>
            <MiEmpresaPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/empresa/solicitar-campana"
        element={
          <ProtectedRoute>
            <SolicitudCampanaPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/empresa/solicitar-producto"
        element={
          <ProtectedRoute>
            <SolicitudProductoPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/empresa/editar-campana/:id"
        element={
          <ProtectedRoute>
            <EditarCampanaPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/empresa/editar-producto/:id"
        element={
          <ProtectedRoute>
            <EditarProductoPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default EmpresaRoutes;
