import React, { useState } from 'react';

// Ejemplo de formulario de registro de empresa con validación robusta
export default function RegistroEmpresaValidado() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    tipoEmpresa: '',
    rubro: '',
    telefono: '',
    aceptaTerminos: false
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre) newErrors.nombre = 'El nombre es obligatorio';
    if (!formData.email || !/^[^@]+@[^@]+\.[a-zA-Z]{2,}$/.test(formData.email)) newErrors.email = 'Email inválido';
    if (!formData.tipoEmpresa) newErrors.tipoEmpresa = 'Selecciona un tipo de empresa';
    if (!formData.rubro) newErrors.rubro = 'Selecciona un rubro';
    if (!formData.telefono || !/^\d{9,15}$/.test(formData.telefono)) newErrors.telefono = 'Teléfono inválido';
    if (!formData.aceptaTerminos) newErrors.aceptaTerminos = 'Debes aceptar los términos';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
    // Aquí iría la lógica de guardado en Firestore
  };

  return (
    <form className="max-w-lg mx-auto p-6 bg-white rounded shadow" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-4">Registro de Empresa</h2>
      <div className="mb-4">
        <label className="block mb-1">Nombre *</label>
        <input name="nombre" value={formData.nombre} onChange={handleChange} className={`w-full border p-2 rounded ${errors.nombre ? 'border-red-500' : ''}`} />
        {errors.nombre && <span className="text-red-500 text-sm">{errors.nombre}</span>}
      </div>
      <div className="mb-4">
        <label className="block mb-1">Email *</label>
        <input name="email" value={formData.email} onChange={handleChange} className={`w-full border p-2 rounded ${errors.email ? 'border-red-500' : ''}`} />
        {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
      </div>
      <div className="mb-4">
        <label className="block mb-1">Tipo de Empresa *</label>
        <select name="tipoEmpresa" value={formData.tipoEmpresa} onChange={handleChange} className={`w-full border p-2 rounded ${errors.tipoEmpresa ? 'border-red-500' : ''}`}>
          <option value="">Selecciona...</option>
          <option value="proveedor">Proveedor</option>
          <option value="pyme">PyME</option>
          <option value="empresa">Empresa</option>
          <option value="emprendimiento">Emprendimiento</option>
        </select>
        {errors.tipoEmpresa && <span className="text-red-500 text-sm">{errors.tipoEmpresa}</span>}
      </div>
      <div className="mb-4">
        <label className="block mb-1">Rubro *</label>
        <input name="rubro" value={formData.rubro} onChange={handleChange} className={`w-full border p-2 rounded ${errors.rubro ? 'border-red-500' : ''}`} />
        {errors.rubro && <span className="text-red-500 text-sm">{errors.rubro}</span>}
      </div>
      <div className="mb-4">
        <label className="block mb-1">Teléfono *</label>
        <input name="telefono" value={formData.telefono} onChange={handleChange} className={`w-full border p-2 rounded ${errors.telefono ? 'border-red-500' : ''}`} />
        {errors.telefono && <span className="text-red-500 text-sm">{errors.telefono}</span>}
      </div>
      <div className="mb-4 flex items-center">
        <input type="checkbox" name="aceptaTerminos" checked={formData.aceptaTerminos} onChange={handleChange} className="mr-2" />
        <label>Acepto los términos y condiciones *</label>
        {errors.aceptaTerminos && <span className="text-red-500 text-sm ml-2">{errors.aceptaTerminos}</span>}
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={submitted}>Registrar</button>
      {submitted && <div className="mt-4 text-green-600 font-semibold">¡Registro exitoso!</div>}
    </form>
  );
}
