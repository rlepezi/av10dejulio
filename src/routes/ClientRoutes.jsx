import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedClientRoute from '../components/ProtectedClientRoute';

// Componentes de cliente
import RegistroCliente from '../components/RegistroCliente';
import DashboardCliente from '../components/DashboardCliente';
import ClientValidationStatus from '../components/ClientValidationStatus';
import GestionVehiculos from '../components/GestionVehiculos';
import ServiciosVehiculo from '../components/ServiciosVehiculo';
import EditarVehiculo from '../components/EditarVehiculo';
import ServicioRevisionTecnica from '../components/ServicioRevisionTecnica';

const ClientRoutes = () => {
  return (
    <Routes>
      {/* Rutas públicas de registro */}
      <Route path="/registro-cliente" element={<RegistroCliente />} />
      
      {/* Estado de validación */}
      <Route path="/status-cliente" element={<ClientValidationStatus />} />
      
      {/* Rutas protegidas de cliente */}
      <Route
        path="/dashboard/cliente"
        element={
          <ProtectedClientRoute>
            <DashboardCliente />
          </ProtectedClientRoute>
        }
      />
      
      <Route
        path="/vehiculos/agregar"
        element={
          <ProtectedClientRoute>
            <GestionVehiculos />
          </ProtectedClientRoute>
        }
      />
      
      <Route
        path="/vehiculos/gestionar"
        element={
          <ProtectedClientRoute>
            <GestionVehiculos />
          </ProtectedClientRoute>
        }
      />
      
      <Route
        path="/vehiculos/:id/servicios"
        element={
          <ProtectedClientRoute>
            <ServiciosVehiculo />
          </ProtectedClientRoute>
        }
      />
      
      <Route
        path="/vehiculos/:id/editar"
        element={
          <ProtectedClientRoute>
            <EditarVehiculo />
          </ProtectedClientRoute>
        }
      />
      
      {/* Servicios */}
      <Route
        path="/servicios/revision-tecnica"
        element={
          <ProtectedClientRoute>
            <ServicioRevisionTecnica />
          </ProtectedClientRoute>
        }
      />
      
      {/* Ruta específica para dashboard cliente */}
      <Route
        path="/dashboard/cliente/revision-tecnica"
        element={
          <ProtectedClientRoute>
            <ServicioRevisionTecnica />
          </ProtectedClientRoute>
        }
      />
    </Routes>
  );
};

export default ClientRoutes;
