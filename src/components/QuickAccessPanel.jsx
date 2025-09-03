import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function QuickAccessPanel() {
  const navigate = useNavigate();
  const [recentEmpresas, setRecentEmpresas] = useState([]);
  const [recentClientes, setRecentClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadRecentData();
  }, []);

  const loadRecentData = async () => {
    try {
      setLoading(true);
      
      // Cargar empresas recientes
      const empresasRef = collection(db, 'empresas');
      const empresasQuery = query(
        empresasRef, 
        orderBy('fechaCreacion', 'desc'), 
        limit(5)
      );
      const empresasSnap = await getDocs(empresasQuery);
      setRecentEmpresas(empresasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Cargar clientes recientes
      const clientesRef = collection(db, 'clientes');
      const clientesQuery = query(
        clientesRef, 
        orderBy('fechaRegistro', 'desc'), 
        limit(5)
      );
      const clientesSnap = await getDocs(clientesQuery);
      setRecentClientes(clientesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error) {
      console.error('Error loading recent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const results = [];

      // Buscar en empresas
      const empresasRef = collection(db, 'empresas');
      const empresasQuery = query(
        empresasRef,
        where('nombre', '>=', searchTerm),
        where('nombre', '<=', searchTerm + '\uf8ff'),
        limit(10)
      );
      const empresasSnap = await getDocs(empresasQuery);
      empresasSnap.docs.forEach(doc => {
        results.push({
          id: doc.id,
          ...doc.data(),
          tipo: 'empresa',
          displayName: doc.data().nombre || 'Sin nombre'
        });
      });

      // Buscar en clientes
      const clientesRef = collection(db, 'clientes');
      const clientesQuery = query(
        clientesRef,
        where('nombre', '>=', searchTerm),
        where('nombre', '<=', searchTerm + '\uf8ff'),
        limit(10)
      );
      const clientesSnap = await getDocs(clientesQuery);
      clientesSnap.docs.forEach(doc => {
        results.push({
          id: doc.id,
          ...doc.data(),
          tipo: 'cliente',
          displayName: doc.data().nombre || 'Sin nombre'
        });
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAccessProfile = (item) => {
    if (item.tipo === 'empresa') {
      navigate(`/admin/editar-empresa/${item.id}`);
    } else if (item.tipo === 'cliente') {
      navigate(`/admin/editar-cliente/${item.id}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'activa':
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
      case 'en_revision':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactiva':
      case 'inactivo':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'activa':
      case 'activo':
        return 'Activo';
      case 'pendiente':
      case 'en_revision':
        return 'Pendiente';
      case 'inactiva':
      case 'inactivo':
        return 'Inactivo';
      default:
        return status || 'Desconocido';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Panel de Búsqueda Rápida */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🔍 Acceso Rápido a Perfiles</h2>
        
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre de empresa o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {searching ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* Resultados de búsqueda */}
        {searchResults.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="font-medium text-gray-900">Resultados de búsqueda</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {searchResults.map((item) => (
                <div key={`${item.tipo}-${item.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {item.tipo === 'empresa' ? '🏢' : '👤'}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{item.displayName}</p>
                      <p className="text-sm text-gray-600">
                        {item.tipo === 'empresa' ? 'Empresa' : 'Cliente'} • {item.email || 'Sin email'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.estado)}`}>
                      {getStatusText(item.estado)}
                    </span>
                    <button
                      onClick={() => handleAccessProfile(item)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      Acceder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empresas Recientes */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">🏢 Empresas Recientes</h2>
          <button
            onClick={() => navigate('/admin/empresas')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Ver todas →
          </button>
        </div>
        
        <div className="space-y-3">
          {recentEmpresas.map((empresa) => (
            <div key={empresa.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏢</span>
                <div>
                  <p className="font-medium text-gray-900">{empresa.nombre || 'Sin nombre'}</p>
                  <p className="text-sm text-gray-600">{empresa.email || 'Sin email'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(empresa.estado)}`}>
                  {getStatusText(empresa.estado)}
                </span>
                <button
                  onClick={() => navigate(`/admin/editar-empresa/${empresa.id}`)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Validar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clientes Recientes */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">👤 Clientes Recientes</h2>
          <button
            onClick={() => navigate('/admin/clientes')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Ver todos →
          </button>
        </div>
        
        <div className="space-y-3">
          {recentClientes.map((cliente) => (
            <div key={cliente.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <p className="font-medium text-gray-900">{cliente.nombre || 'Sin nombre'}</p>
                  <p className="text-sm text-gray-600">{cliente.email || 'Sin email'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(cliente.estado)}`}>
                  {getStatusText(cliente.estado)}
                </span>
                <button
                  onClick={() => navigate(`/admin/editar-cliente/${cliente.id}`)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Revisar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Acciones Rápidas</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/crear-empresa')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors"
          >
            <div className="text-2xl mb-2">➕</div>
            <div className="font-medium text-gray-900">Nueva Empresa</div>
            <div className="text-sm text-gray-600">Crear perfil</div>
          </button>

          <button
            onClick={() => navigate('/admin/crear-cliente')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors"
          >
            <div className="text-2xl mb-2">👤</div>
            <div className="font-medium text-gray-900">Nuevo Cliente</div>
            <div className="text-sm text-gray-600">Registrar</div>
          </button>

          <button
            onClick={() => navigate('/admin/validaciones')}
            className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-center transition-colors"
          >
            <div className="text-2xl mb-2">✅</div>
            <div className="font-medium text-gray-900">Validaciones</div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </button>

          <button
            onClick={() => navigate('/admin/estadisticas')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium text-gray-900">Estadísticas</div>
            <div className="text-sm text-gray-600">Dashboard</div>
          </button>
        </div>
      </div>
    </div>
  );
}



