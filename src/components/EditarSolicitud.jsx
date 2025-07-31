import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function EditarSolicitud() {
  const navigate = useNavigate();
  const location = useLocation();
  const solicitud = location.state?.solicitud;
  const [formData, setFormData] = useState(solicitud || {});
  const [checks, setChecks] = useState({});

  if (!solicitud) {
    return <div className="p-8">No hay datos de solicitud para editar.</div>;
  }

  // Genera los campos editables y checkboxes
  const renderEditableFields = () => {
    return Object.entries(formData).map(([key, value]) => (
      <div key={key} className="mb-4 flex items-center gap-4">
        <label className="font-medium w-48">{key}:</label>
        <input
          className="border rounded px-2 py-1 flex-1"
          type="text"
          value={value ?? ''}
          onChange={e => setFormData({ ...formData, [key]: e.target.value })}
        />
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={!!checks[key]}
            onChange={e => setChecks({ ...checks, [key]: e.target.checked })}
          />
          <span className="text-xs">Validado</span>
        </label>
      </div>
    ));
  };

  const handleSave = () => {
    // Aquí deberías guardar los datos editados y los checks
    alert('Datos guardados (simulado)');
    navigate(-1); // Volver al panel principal
  };

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Editar Solicitud</h2>
      {renderEditableFields()}
      <div className="mt-8 flex gap-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSave}>Guardar</button>
        <button className="px-4 py-2 bg-gray-300 text-gray-800 rounded" onClick={() => navigate(-1)}>Cancelar</button>
      </div>
    </div>
  );
}
