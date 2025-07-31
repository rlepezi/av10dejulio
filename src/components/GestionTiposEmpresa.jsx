import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  query, 
  where,
  getDocs 
} from 'firebase/firestore';

const GestionTiposEmpresa = () => {
  const { rol } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState({});

  // Tipos de empresa disponibles
  const tiposEmpresa = {
    'proveedor': {
      nombre: 'Proveedor',
      color: 'blue',
      descripcion: 'Empresa proveedora estándar',
      icon: '🏪'
    },
    'local': {
      nombre: 'Local',
      color: 'green',
      descripcion: 'Negocio local de la zona',
      icon: '🏪'
    },
    'pyme': {
      nombre: 'PyME',
      color: 'yellow',
      descripcion: 'Pequeña y Mediana Empresa',
      icon: '🏢'
    },
    'emprendimiento': {
      nombre: 'Emprendimiento',
      color: 'purple',
      descripcion: 'Nuevo emprendimiento',
      icon: '🚀'
    },
    'premium': {
      nombre: 'Premium',
      color: 'orange',
      descripcion: 'Proveedor premium verificado',
      icon: '⭐'
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "empresas"), where('estado', '==', 'activa')),
      (snapshot) => {
        const empresasData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEmpresas(empresasData);
        calcularEstadisticas(empresasData);
      }
    );

    return () => unsubscribe();
  }, []);

  const calcularEstadisticas = (empresasData) => {
    const stats = {};
    
    Object.keys(tiposEmpresa).forEach(tipo => {
      stats[tipo] = empresasData.filter(empresa => {
        // Normalizar a minúsculas para evitar problemas de mayúsculas/minúsculas
        const tipoEmpresa = (empresa.tipoEmpresa || '').toLowerCase();
        return tipoEmpresa === tipo || 
          (tipo === 'local' && empresa.esLocal) ||
          (tipo === 'pyme' && empresa.esPyme) ||
          (tipo === 'emprendimiento' && empresa.esEmprendimiento) ||
          (tipo === 'premium' && empresa.esPremium);
      }).length;
    });
    
    stats.total = empresasData.length;
    stats.sinTipo = empresasData.filter(empresa => !empresa.tipoEmpresa).length;
    
    setEstadisticas(stats);
  };

  const actualizarTipoEmpresa = async (empresaId, nuevoTipo) => {
    try {
      setLoading(true);
      
      const updates = {
        tipoEmpresa: nuevoTipo,
        fechaActualizacion: new Date()
      };

      // Resetear flags antiguos
      updates.esLocal = false;
      updates.esPyme = false;
      updates.esEmprendimiento = false;
      updates.esPremium = false;

      // Establecer el flag correspondiente
      switch (nuevoTipo) {
        case 'local':
          updates.esLocal = true;
          break;
        case 'pyme':
          updates.esPyme = true;
          break;
        case 'emprendimiento':
          updates.esEmprendimiento = true;
          break;
        case 'premium':
          updates.esPremium = true;
          break;
      }

      await updateDoc(doc(db, "empresas", empresaId), updates);
    } catch (error) {
      console.error('Error actualizando tipo de empresa:', error);
      alert('Error al actualizar el tipo de empresa');
    } finally {
      setLoading(false);
    }
  };

  const empresasFiltradas = empresas.filter(empresa => {
    if (filtroTipo === 'todos') return true;
    if (filtroTipo === 'sinTipo') return !empresa.tipoEmpresa;

    // Normalizar a minúsculas para evitar problemas de mayúsculas/minúsculas
    const tipoEmpresa = (empresa.tipoEmpresa || '').toLowerCase();
    return tipoEmpresa === filtroTipo ||
           (filtroTipo === 'local' && empresa.esLocal) ||
           (filtroTipo === 'pyme' && empresa.esPyme) ||
           (filtroTipo === 'emprendimiento' && empresa.esEmprendimiento) ||
           (filtroTipo === 'premium' && empresa.esPremium);
  });

  const getBadgeColor = (tipo) => {
    const colores = {
      'proveedor': 'bg-blue-100 text-blue-800',
      'local': 'bg-green-100 text-green-800',
      'pyme': 'bg-yellow-100 text-yellow-800',
      'emprendimiento': 'bg-purple-100 text-purple-800',
      'premium': 'bg-orange-100 text-orange-800'
    };
    return colores[tipo] || 'bg-gray-100 text-gray-800';
  };

  if (rol !== 'admin') {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Solo administradores pueden gestionar tipos de empresa</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">
            🏢 Gestión de Tipos de Empresa
          </h1>
          <p className="text-gray-600 mt-2">
            Administra y categoriza las empresas según su tipo
          </p>
        </div>

        {/* Estadísticas */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold mb-4">📊 Estadísticas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-700">{estadisticas.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            
            {Object.entries(tiposEmpresa).map(([tipo, config]) => (
              <div key={tipo} className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-xl mb-1">{config.icon}</div>
                <div className="text-2xl font-bold text-gray-700">
                  {estadisticas[tipo] || 0}
                </div>
                <div className="text-sm text-gray-600">{config.nombre}</div>
              </div>
            ))}
            
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{estadisticas.sinTipo || 0}</div>
              <div className="text-sm text-red-600">Sin Tipo</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold mb-4">🔍 Filtros</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                filtroTipo === 'todos' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todas ({estadisticas.total})
            </button>
            
            {Object.entries(tiposEmpresa).map(([tipo, config]) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  filtroTipo === tipo 
                    ? `bg-${config.color}-600 text-white` 
                    : `bg-${config.color}-100 text-${config.color}-700 hover:bg-${config.color}-200`
                }`}
              >
                {config.icon} {config.nombre} ({estadisticas[tipo] || 0})
              </button>
            ))}
            
            <button
              onClick={() => setFiltroTipo('sinTipo')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                filtroTipo === 'sinTipo' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              Sin Tipo ({estadisticas.sinTipo || 0})
            </button>
          </div>
        </div>

        {/* Lista de empresas */}
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            📋 Empresas Filtradas ({empresasFiltradas.length})
          </h2>
          
          <div className="space-y-4">
            {empresasFiltradas.map((empresa) => (
              <div key={empresa.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {empresa.nombre}
                      </h3>
                      
                      {empresa.tipoEmpresa && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getBadgeColor(empresa.tipoEmpresa)}`}>
                          {tiposEmpresa[empresa.tipoEmpresa]?.icon} {tiposEmpresa[empresa.tipoEmpresa]?.nombre}
                        </span>
                      )}
                      
                      {!empresa.tipoEmpresa && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                          Sin Tipo
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>📍 {empresa.direccion}, {empresa.ciudad}</div>
                      {empresa.telefono && <div>📞 {empresa.telefono}</div>}
                      {empresa.email && <div>📧 {empresa.email}</div>}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <select
                      value={empresa.tipoEmpresa || ''}
                      onChange={(e) => actualizarTipoEmpresa(empresa.id, e.target.value)}
                      disabled={loading}
                      className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar tipo</option>
                      {Object.entries(tiposEmpresa).map(([tipo, config]) => (
                        <option key={tipo} value={tipo}>
                          {config.icon} {config.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
            
            {empresasFiltradas.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay empresas que coincidan con el filtro seleccionado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionTiposEmpresa;
