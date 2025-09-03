import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Agente de Campo
import DashboardAgente from '../components/DashboardAgente';

// Otros roles especializados
import DashboardMecanico from '../components/DashboardMecanico';
import DashboardEmpresa from '../components/DashboardEmpresa';
import RegistroEmpresa from '../components/RegistroEmpresa';

// Dashboard de switch/redirección
import DashboardSwitch from '../components/DashboardSwitch';

const OtherRoutes = () => {
  return (
    <Routes>
      {/* Dashboard general que redirige según el rol */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardSwitch />
          </ProtectedRoute>
        }
      />
      
      {/* Dashboard específico para empresas */}
      <Route
        path="/dashboard/proveedor"
        element={
          <ProtectedRoute>
            <DashboardEmpresa />
          </ProtectedRoute>
        }
      />
      
      {/* Dashboard específico para agentes de campo */}
      <Route
        path="/dashboard/agente"
        element={
          <ProtectedRoute>
            <DashboardAgente />
          </ProtectedRoute>
        }
      />
      
      {/* Dashboard para mecánicos (futuro) */}
      <Route
        path="/dashboard/mecanico"
        element={
          <ProtectedRoute>
            <DashboardMecanico />
          </ProtectedRoute>
        }
      />
      
      {/* Registro para empresas */}
      <Route path="/registro-empresa" element={<RegistroEmpresa />} />
      
      {/* Clientes que acceden directamente a areas */}
      <Route path="/clientes-area" element={
        <ProtectedRoute>
          {/* Este podría ser un componente específico o redirección */}
          <div>Área de clientes</div>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default OtherRoutes;
