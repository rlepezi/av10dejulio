import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';

export default function ServicioSeguros() {
  const { user, rol } = useAuth();
  const [companiasSeguros, setCompaniasSeguros] = useState([]);
  const [tiposSeguros, setTiposSeguros] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [polizas, setPolizas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cotizar');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar compañías de seguros
      const companiasSnapshot = await getDocs(collection(db, 'companias_seguros'));
      setCompaniasSeguros(companiasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Cargar tipos de seguros
      const tiposSnapshot = await getDocs(collection(db, 'tipos_seguros'));
      setTiposSeguros(tiposSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      if (user) {
        // Cargar cotizaciones del usuario
        const cotizacionesQuery = query(
          collection(db, 'cotizaciones_seguros'),
          where('userId', '==', user.uid)
        );
        const cotizacionesSnapshot = await getDocs(cotizacionesQuery);
        setCotizaciones(cotizacionesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Cargar pólizas del usuario
        const polizasQuery = query(
          collection(db, 'polizas_seguros'),
          where('userId', '==', user.uid)
        );
        const polizasSnapshot = await getDocs(polizasQuery);
        setPolizas(polizasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCotizar = async (datosVehiculo) => {
    try {
      const cotizacion = {
        userId: user.uid,
        vehiculo: datosVehiculo,
        estado: 'pendiente',
        fechaCreacion: new Date(),
        companias: companiasSeguros.map(comp => ({
          id: comp.id,
          nombre: comp.nombre,
          cotizacion: calcularCotizacion(datosVehiculo, comp)
        }))
      };

      await addDoc(collection(db, 'cotizaciones_seguros'), cotizacion);
      await loadData();
      setShowModal(false);
    } catch (error) {
      console.error('Error creating cotización:', error);
    }
  };

  const calcularCotizacion = (vehiculo, compania) => {
    // Lógica básica de cotización
    const basePrice = vehiculo.valor * 0.02; // 2% del valor del vehículo
    const factorRiesgo = vehiculo.antiguedad > 10 ? 1.3 : 1.0;
    const factorRegion = vehiculo.region === 'RM' ? 1.2 : 1.0;
    
    return Math.round(basePrice * factorRiesgo * factorRegion * compania.factor);
  };

  const contratarSeguro = async (cotizacionId, companiaId) => {
    try {
      const cotizacion = cotizaciones.find(c => c.id === cotizacionId);
      const compania = cotizacion.companias.find(c => c.id === companiaId);
      
      const poliza = {
        userId: user.uid,
        cotizacionId,
        companiaId,
        vehiculo: cotizacion.vehiculo,
        prima: compania.cotizacion,
        estado: 'activa',
        fechaInicio: new Date(),
        fechaVencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
        numeroPoliza: `POL-${Date.now()}`
      };

      await addDoc(collection(db, 'polizas_seguros'), poliza);
      await updateDoc(doc(db, 'cotizaciones_seguros', cotizacionId), {
        estado: 'contratada'
      });
      
      await loadData();
    } catch (error) {
      console.error('Error contracting insurance:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">🛡️ Seguros Automotrices</h1>
        
        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            className={`pb-2 px-4 ${activeTab === 'cotizar' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('cotizar')}
          >
            Cotizar Seguro
          </button>
          <button
            className={`pb-2 px-4 ${activeTab === 'cotizaciones' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('cotizaciones')}
          >
            Mis Cotizaciones
          </button>
          <button
            className={`pb-2 px-4 ${activeTab === 'polizas' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('polizas')}
          >
            Mis Pólizas
          </button>
          {rol === 'admin' && (
            <button
              className={`pb-2 px-4 ${activeTab === 'admin' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('admin')}
            >
              Administración
            </button>
          )}
        </div>

        {/* Content */}
        {activeTab === 'cotizar' && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Cotiza tu seguro automotriz</h3>
              <p className="text-gray-700 mb-4">
                Compara precios de las principales compañías de seguros en Chile
              </p>
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                onClick={() => setShowModal(true)}
              >
                Iniciar Cotización
              </button>
            </div>

            {/* Compañías disponibles */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Compañías Disponibles</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companiasSeguros.map(compania => (
                  <div key={compania.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <img 
                        src={compania.logo || '/images/default-insurance.png'} 
                        alt={compania.nombre}
                        className="w-12 h-12 object-contain"
                      />
                      <div>
                        <h4 className="font-semibold">{compania.nombre}</h4>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm">{compania.rating || 4.5}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{compania.descripcion}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {compania.cobertura?.map(tipo => (
                        <span key={tipo} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {tipo}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cotizaciones' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Mis Cotizaciones</h3>
            {cotizaciones.length === 0 ? (
              <p className="text-gray-500">No tienes cotizaciones aún.</p>
            ) : (
              cotizaciones.map(cotizacion => (
                <div key={cotizacion.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">
                        {cotizacion.vehiculo.marca} {cotizacion.vehiculo.modelo} {cotizacion.vehiculo.año}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Patente: {cotizacion.vehiculo.patente}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      cotizacion.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      cotizacion.estado === 'contratada' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {cotizacion.estado}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                    {cotizacion.companias.map(comp => (
                      <div key={comp.id} className="border rounded p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{comp.nombre}</span>
                          <span className="text-lg font-bold text-blue-600">
                            ${comp.cotizacion.toLocaleString()}
                          </span>
                        </div>
                        {cotizacion.estado === 'pendiente' && (
                          <button
                            className="w-full mt-2 bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700"
                            onClick={() => contratarSeguro(cotizacion.id, comp.id)}
                          >
                            Contratar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'polizas' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Mis Pólizas</h3>
            {polizas.length === 0 ? (
              <p className="text-gray-500">No tienes pólizas contratadas.</p>
            ) : (
              polizas.map(poliza => (
                <div key={poliza.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold">Póliza #{poliza.numeroPoliza}</h4>
                      <p className="text-sm text-gray-600">
                        {poliza.vehiculo.marca} {poliza.vehiculo.modelo} {poliza.vehiculo.año}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      poliza.estado === 'activa' ? 'bg-green-100 text-green-800' :
                      poliza.estado === 'vencida' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {poliza.estado}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Prima Mensual:</span>
                      <p className="font-semibold">${(poliza.prima / 12).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Inicio:</span>
                      <p className="font-semibold">
                        {new Date(poliza.fechaInicio.seconds * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Vencimiento:</span>
                      <p className="font-semibold">
                        {new Date(poliza.fechaVencimiento.seconds * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                      Ver Detalles
                    </button>
                    <button className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
                      Descargar Póliza
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal de cotización */}
      {showModal && (
        <CotizacionModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCotizar}
          tiposSeguros={tiposSeguros}
        />
      )}
    </div>
  );
}

// Modal component para cotización
function CotizacionModal({ onClose, onSubmit, tiposSeguros }) {
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    año: '',
    patente: '',
    valor: '',
    uso: 'particular',
    region: '',
    tipoSeguro: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Datos del Vehículo</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Marca</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={formData.marca}
              onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Modelo</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={formData.modelo}
              onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Año</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={formData.año}
              onChange={(e) => setFormData(prev => ({ ...prev, año: parseInt(e.target.value) }))}
              min="1990"
              max={new Date().getFullYear() + 1}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Patente</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={formData.patente}
              onChange={(e) => setFormData(prev => ({ ...prev, patente: e.target.value.toUpperCase() }))}
              placeholder="XXXX00"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Valor del Vehículo (UF)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={formData.valor}
              onChange={(e) => setFormData(prev => ({ ...prev, valor: parseInt(e.target.value) }))}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Uso del Vehículo</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.uso}
              onChange={(e) => setFormData(prev => ({ ...prev, uso: e.target.value }))}
              required
            >
              <option value="particular">Particular</option>
              <option value="comercial">Comercial</option>
              <option value="taxi">Taxi</option>
              <option value="uber">Uber/Cabify</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Región</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.region}
              onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
              required
            >
              <option value="">Seleccionar región</option>
              <option value="RM">Región Metropolitana</option>
              <option value="V">Valparaíso</option>
              <option value="VIII">Biobío</option>
              <option value="IX">La Araucanía</option>
              <option value="X">Los Lagos</option>
              {/* Agregar más regiones */}
            </select>
          </div>
          
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Cotizar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
