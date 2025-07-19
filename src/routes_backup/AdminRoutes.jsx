import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';

// Layouts
import AdminLayout from '../components/AdminLayout';

// Páginas de administración específicas que no están en AdminLayout
import AdminDashboardPage from '../pages/AdminDashboardPage';

const AdminRoutes = () => {
  return (
    <Routes>
      {/* Dashboard principal del admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      
      {/* Layout de administración que maneja todas las sub-rutas */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AdminRoutes;
