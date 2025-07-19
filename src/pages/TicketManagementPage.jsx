import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import TicketManagement from '../components/TicketManagement';

const TicketManagementPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Tickets y Feedback
          </h1>
          <p className="text-gray-600 mt-2">
            Administra las consultas, sugerencias, reclamos y solicitudes de soporte de los usuarios.
          </p>
        </div>
        
        <TicketManagement />
      </div>
    </DashboardLayout>
  );
};

export default TicketManagementPage;
