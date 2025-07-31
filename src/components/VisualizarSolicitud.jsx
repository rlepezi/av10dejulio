// VisualizarSolicitud.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function VisualizarSolicitud() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSolicitud() {
      setLoading(true);
      try {
        const docRef = doc(db, 'solicitudes_empresa', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSolicitud({ id: docSnap.id, ...docSnap.data() });
        } else {
          setSolicitud(null);
        }
      } catch (error) {
        setSolicitud(null);
      } finally {
        setLoading(false);
      }
    }
    fetchSolicitud();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando solicitud...</div>;
  if (!solicitud) return <div className="p-8 text-center text-red-600">Solicitud no encontrada</div>;

  // Helper for estado color
  const getColorEstado = (estado) => {
    const colors = {
      pendiente: 'yellow',
      en_revision: 'blue',
      activada: 'green',
      credenciales_asignadas: 'purple',
      rechazada: 'red'
    };
    return colors[estado] || 'gray';
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900">Visualización de Solicitud</h2>
        <button className="text-gray-400 hover:text-gray-600 text-2xl" onClick={() => navigate(-1)}>✕</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Empresa</h3>
          <div className="mb-1"><span className="font-medium">Nombre:</span> {solicitud.nombre_empresa}</div>
          <div className="mb-1"><span className="font-medium">Email:</span> {solicitud.email_empresa}</div>
          <div className="mb-1"><span className="font-medium">Teléfono:</span> {solicitud.telefono_empresa}</div>
          <div className="mb-1"><span className="font-medium">Dirección:</span> {solicitud.direccion_empresa}</div>
          <div className="mb-1"><span className="font-medium">Comuna:</span> {solicitud.comuna}</div>
          <div className="mb-1"><span className="font-medium">Región:</span> {solicitud.region}</div>
          <div className="mb-1"><span className="font-medium">RUT:</span> {solicitud.rut_empresa}</div>
          <div className="mb-1"><span className="font-medium">Web:</span> {solicitud.web_actual}</div>
          <div className="mb-1"><span className="font-medium">Categoría:</span> {solicitud.categoria}</div>
          <div className="mb-1"><span className="font-medium">Estado:</span> <span className={`font-bold text-${getColorEstado(solicitud.estado)}-700`}>{solicitud.estado}</span></div>
          <div className="mb-1"><span className="font-medium">ID:</span> {solicitud.id}</div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Representante Legal</h3>
          <div className="mb-1"><span className="font-medium">Nombres:</span> {solicitud.nombres_representante || solicitud.representante_nombre}</div>
          <div className="mb-1"><span className="font-medium">Apellidos:</span> {solicitud.apellidos_representante || solicitud.representante_apellidos}</div>
          <div className="mb-1"><span className="font-medium">Cargo:</span> {solicitud.cargo_representante}</div>
          <div className="mb-1"><span className="font-medium">Email:</span> {solicitud.email_representante}</div>
          <div className="mb-1"><span className="font-medium">Teléfono:</span> {solicitud.telefono_representante}</div>
        </div>
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Descripción</h3>
        <div className="bg-gray-50 rounded p-3 text-gray-700">{solicitud.descripcion || solicitud.descripcion_empresa || <span className="text-red-700">[Sin descripción]</span>}</div>
      </div>
      {/* Sección avanzada: mostrar todos los campos si se requiere */}
      <details className="mb-4">
        <summary className="cursor-pointer text-blue-700 font-medium mb-2">Ver información completa (debug)</summary>
        <div className="mt-2 border-t pt-2 text-xs">
          <pre>{JSON.stringify(solicitud, null, 2)}</pre>
        </div>
      </details>
    </div>
  );
}
