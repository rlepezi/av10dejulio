
import React, { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function EmpresasAsignadasAgente() {
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmpresas = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Buscar el agente por email para obtener su ID
        const agentesQuery = query(
          collection(db, "agentes"),
          where("email", "==", user.email)
        );
        const agentesSnap = await getDocs(agentesQuery);
        if (agentesSnap.empty) {
          setEmpresas([]);
          setLoading(false);
          return;
        }
        const agenteId = agentesSnap.docs[0].id;
        // Buscar empresas asignadas a ese agente
        const empresasQuery = query(
          collection(db, "empresas"),
          where("agenteAsignado", "==", agenteId)
        );
        const empresasSnap = await getDocs(empresasQuery);
        setEmpresas(empresasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        setEmpresas([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEmpresas();
  }, [user]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🏢 Empresas Asignadas</h1>
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando empresas asignadas...</p>
        </div>
      ) : empresas.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No tienes empresas asignadas actualmente.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {empresas.map(empresa => (
            <a
              key={empresa.id}
              href={`/agente/empresa/${empresa.id}`}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm block hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{empresa.nombre}</h3>
              <p className="text-sm text-gray-600 mb-1">{empresa.direccion}</p>
              <p className="text-sm text-gray-600 mb-1">{empresa.ciudad}, {empresa.region}</p>
              <span className={`px-2 py-1 rounded text-xs font-medium ${empresa.estado === 'Activa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{empresa.estado || 'Sin estado'}</span>
              <span className="block mt-2 text-blue-600 underline text-sm">Ver detalle y validar</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
