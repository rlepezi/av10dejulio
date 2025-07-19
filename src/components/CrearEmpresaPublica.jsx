import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export default function CrearEmpresaPublica({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    sitio_web: '',
    horario_atencion: '',
    categoria: '',
    marcas: [],
    logo_url: '',
    descripcion: '',
    lat: '',
    lng: ''
  });

  const [categorias, setCategorias] = useState([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarCategorias();
    cargarMarcas();
  }, []);

  const cargarCategorias = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'categorias'));
      const categoriasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const cargarMarcas = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'marcas'));
      const marcasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMarcasDisponibles(marcasData);
    } catch (error) {
      console.error('Error cargando marcas:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMarcaChange = (marcaId) => {
    setFormData(prev => ({
      ...prev,
      marcas: prev.marcas.includes(marcaId) 
        ? prev.marcas.filter(id => id !== marcaId)
        : [...prev.marcas, marcaId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validaciones básicas
      if (!formData.nombre || !formData.direccion || !formData.categoria || !formData.sitio_web || !formData.logo_url) {
        alert('Por favor complete todos los campos obligatorios (nombre, dirección, categoría, sitio web, logo)');
        setLoading(false);
        return;
      }

      const empresaData = {
        ...formData,
        estado: 'activa', // Se activa inmediatamente
        tipo_empresa: 'publica', // Empresa pública (visible para todos)
        es_comunidad: false, // No es parte de la comunidad aún
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
        creado_por: 'admin'
      };

      await addDoc(collection(db, 'empresas'), empresaData);
      
      alert('¡Empresa pública creada exitosamente!');
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Error creando empresa:', error);
      alert('Error al crear la empresa. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Crear Empresa Pública</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Información Básica</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección *
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Información de Negocio */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Información de Negocio</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sitio Web *
                </label>
                <input
                  type="url"
                  name="sitio_web"
                  value={formData.sitio_web}
                  onChange={handleChange}
                  placeholder="https://ejemplo.com"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL del Logo *
                </label>
                <input
                  type="url"
                  name="logo_url"
                  value={formData.logo_url}
                  onChange={handleChange}
                  placeholder="https://ejemplo.com/logo.png"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horario de Atención *
                </label>
                <input
                  type="text"
                  name="horario_atencion"
                  value={formData.horario_atencion}
                  onChange={handleChange}
                  placeholder="Lun-Vie 9:00-18:00, Sáb 9:00-14:00"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map(categoria => (
                    <option key={categoria.id} value={categoria.nombre}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Marcas */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Marcas que Atiende *</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {marcasDisponibles.map(marca => (
                <label key={marca.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.marcas.includes(marca.id)}
                    onChange={() => handleMarcaChange(marca.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{marca.nombre}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descripción breve de la empresa y sus servicios..."
            />
          </div>

          {/* Coordenadas (Opcional) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitud (Opcional)
              </label>
              <input
                type="number"
                name="lat"
                value={formData.lat}
                onChange={handleChange}
                step="any"
                placeholder="-33.4489"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitud (Opcional)
              </label>
              <input
                type="number"
                name="lng"
                value={formData.lng}
                onChange={handleChange}
                step="any"
                placeholder="-70.6693"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
