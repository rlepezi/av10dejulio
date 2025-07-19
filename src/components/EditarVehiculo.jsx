import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';

export default function EditarVehiculo() {
  const { id: vehiculoId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    patente: '',
    marca: '',
    modelo: '',
    año: '',
    color: '',
    combustible: 'gasolina',
    transmision: 'manual',
    kilometraje: '',
    numeroMotor: '',
    numeroChasis: '',
    valorComercial: '',
    uso: 'particular',
    seguro: '',
    fechaRevisionTecnica: '',
    fechaPermisoCirculacion: '',
    observaciones: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user && vehiculoId) {
      loadVehiculo();
    }
  }, [user, vehiculoId]);

  const loadVehiculo = async () => {
    try {
      const vehiculoDoc = await getDoc(doc(db, 'vehiculos_usuario', vehiculoId));
      
      if (vehiculoDoc.exists()) {
        const vehiculoData = vehiculoDoc.data();
        
        // Verificar que el vehículo pertenece al usuario actual
        if (vehiculoData.userId !== user.uid) {
          navigate('/vehiculos/gestionar');
          return;
        }
        
        // Formatear fechas para input type="date"
        const formatDate = (date) => {
          if (!date) return '';
          if (date.toDate) return date.toDate().toISOString().split('T')[0];
          if (date instanceof Date) return date.toISOString().split('T')[0];
          return new Date(date).toISOString().split('T')[0];
        };

        setFormData({
          patente: vehiculoData.patente || '',
          marca: vehiculoData.marca || '',
          modelo: vehiculoData.modelo || '',
          año: vehiculoData.año?.toString() || '',
          color: vehiculoData.color || '',
          combustible: vehiculoData.combustible || 'gasolina',
          transmision: vehiculoData.transmision || 'manual',
          kilometraje: vehiculoData.kilometraje?.toString() || '',
          numeroMotor: vehiculoData.numeroMotor || '',
          numeroChasis: vehiculoData.numeroChasis || '',
          valorComercial: vehiculoData.valorComercial?.toString() || '',
          uso: vehiculoData.uso || 'particular',
          seguro: vehiculoData.seguro || '',
          fechaRevisionTecnica: formatDate(vehiculoData.fechaRevisionTecnica),
          fechaPermisoCirculacion: formatDate(vehiculoData.fechaPermisoCirculacion),
          observaciones: vehiculoData.observaciones || ''
        });
      } else {
        navigate('/vehiculos/gestionar');
        return;
      }
    } catch (error) {
      console.error('Error loading vehicle:', error);
      navigate('/vehiculos/gestionar');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.patente.trim()) {
      newErrors.patente = 'La patente es requerida';
    } else if (!/^[A-Z0-9]{6}$/.test(formData.patente.replace(/\s+/g, ''))) {
      newErrors.patente = 'Formato de patente inválido (ej: ABC123 o BBVV12)';
    }

    if (!formData.marca.trim()) {
      newErrors.marca = 'La marca es requerida';
    }

    if (!formData.modelo.trim()) {
      newErrors.modelo = 'El modelo es requerido';
    }

    if (!formData.año) {
      newErrors.año = 'El año es requerido';
    } else {
      const año = parseInt(formData.año);
      const añoActual = new Date().getFullYear();
      if (año < 1900 || año > añoActual + 1) {
        newErrors.año = `El año debe estar entre 1900 y ${añoActual + 1}`;
      }
    }

    if (formData.kilometraje && parseInt(formData.kilometraje) < 0) {
      newErrors.kilometraje = 'El kilometraje no puede ser negativo';
    }

    if (formData.valorComercial && parseInt(formData.valorComercial) < 0) {
      newErrors.valorComercial = 'El valor comercial no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const vehiculoData = {
        ...formData,
        patente: formData.patente.toUpperCase().replace(/\s+/g, ''),
        año: parseInt(formData.año),
        kilometraje: formData.kilometraje ? parseInt(formData.kilometraje) : 0,
        valorComercial: formData.valorComercial ? parseInt(formData.valorComercial) : 0,
        fechaModificacion: new Date()
      };

      await updateDoc(doc(db, 'vehiculos_usuario', vehiculoId), vehiculoData);
      
      alert('Vehículo actualizado exitosamente');
      navigate('/vehiculos/gestionar');
    } catch (error) {
      console.error('Error updating vehicle:', error);
      alert('Error al actualizar vehículo. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
          <p className="text-gray-600">Debes iniciar sesión para editar vehículos.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/vehiculos/gestionar')}
            className="text-blue-600 hover:text-blue-800 mr-4"
          >
            ← Volver
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Editar Vehículo</h1>
            <p className="text-gray-600">Modifica la información de tu vehículo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Básica</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patente *
                </label>
                <input
                  type="text"
                  name="patente"
                  value={formData.patente}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg px-3 py-2 ${errors.patente ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="ABC123"
                  maxLength="7"
                />
                {errors.patente && <p className="text-red-500 text-xs mt-1">{errors.patente}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca *
                </label>
                <input
                  type="text"
                  name="marca"
                  value={formData.marca}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg px-3 py-2 ${errors.marca ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Toyota, Chevrolet, etc."
                />
                {errors.marca && <p className="text-red-500 text-xs mt-1">{errors.marca}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modelo *
                </label>
                <input
                  type="text"
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg px-3 py-2 ${errors.modelo ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Corolla, Spark, etc."
                />
                {errors.modelo && <p className="text-red-500 text-xs mt-1">{errors.modelo}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Año *
                </label>
                <input
                  type="number"
                  name="año"
                  value={formData.año}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg px-3 py-2 ${errors.año ? 'border-red-500' : 'border-gray-300'}`}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
                {errors.año && <p className="text-red-500 text-xs mt-1">{errors.año}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Blanco, Negro, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kilometraje
                </label>
                <input
                  type="number"
                  name="kilometraje"
                  value={formData.kilometraje}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg px-3 py-2 ${errors.kilometraje ? 'border-red-500' : 'border-gray-300'}`}
                  min="0"
                  placeholder="150000"
                />
                {errors.kilometraje && <p className="text-red-500 text-xs mt-1">{errors.kilometraje}</p>}
              </div>
            </div>
          </div>

          {/* Especificaciones Técnicas */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Especificaciones Técnicas</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Combustible
                </label>
                <select
                  name="combustible"
                  value={formData.combustible}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="gasolina">Gasolina</option>
                  <option value="diesel">Diésel</option>
                  <option value="hibrido">Híbrido</option>
                  <option value="electrico">Eléctrico</option>
                  <option value="gnc">GNC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transmisión
                </label>
                <select
                  name="transmision"
                  value={formData.transmision}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="manual">Manual</option>
                  <option value="automatica">Automática</option>
                  <option value="semi-automatica">Semi-automática</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Motor
                </label>
                <input
                  type="text"
                  name="numeroMotor"
                  value={formData.numeroMotor}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Número de serie del motor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Chasis
                </label>
                <input
                  type="text"
                  name="numeroChasis"
                  value={formData.numeroChasis}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Número de chasis/VIN"
                />
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Adicional</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Comercial (CLP)
                </label>
                <input
                  type="number"
                  name="valorComercial"
                  value={formData.valorComercial}
                  onChange={handleInputChange}
                  className={`w-full border rounded-lg px-3 py-2 ${errors.valorComercial ? 'border-red-500' : 'border-gray-300'}`}
                  min="0"
                  placeholder="8000000"
                />
                {errors.valorComercial && <p className="text-red-500 text-xs mt-1">{errors.valorComercial}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Uso
                </label>
                <select
                  name="uso"
                  value={formData.uso}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="particular">Particular</option>
                  <option value="comercial">Comercial</option>
                  <option value="taxi">Taxi</option>
                  <option value="uber">Uber/Cabify</option>
                  <option value="transporte_escolar">Transporte Escolar</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compañía de Seguros
                </label>
                <input
                  type="text"
                  name="seguro"
                  value={formData.seguro}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Ej: Mapfre, Liberty, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Revisión Técnica
                </label>
                <input
                  type="date"
                  name="fechaRevisionTecnica"
                  value={formData.fechaRevisionTecnica}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Permiso de Circulación
                </label>
                <input
                  type="date"
                  name="fechaPermisoCirculacion"
                  value={formData.fechaPermisoCirculacion}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows="3"
                  placeholder="Información adicional sobre el vehículo..."
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Actualizar Vehículo'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/vehiculos/gestionar')}
              className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
