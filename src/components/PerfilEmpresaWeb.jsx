import React, { useState } from 'react';

export default function PerfilEmpresaWeb({ empresa, onUpdate }) {
  const [perfilData, setPerfilData] = useState({
    descripcionCompleta: empresa.descripcionCompleta || '',
    servicios:
      empresa.servicios && empresa.servicios.length > 0
        ? empresa.servicios
        : empresa.servicios_completos && empresa.servicios_completos.length > 0
        ? empresa.servicios_completos
        : empresa.categorias_servicios && empresa.categorias_servicios.length > 0
        ? empresa.categorias_servicios
        : empresa.datos_solicitud?.servicios && empresa.datos_solicitud.servicios.length > 0
        ? empresa.datos_solicitud.servicios
        : [],
    galeria: empresa.galeria || [],
    contactoAdicional: empresa.contactoAdicional || {
      whatsapp: '',
      facebook: '',
      instagram: '',
      direccionCompleta: ''
    },
    caracteristicas: empresa.caracteristicas || [],
    testimonios: empresa.testimonios || []
  });

  const [nuevoServicio, setNuevoServicio] = useState('');
  const [nuevaCaracteristica, setNuevaCaracteristica] = useState('');
  const [nuevoTestimonio, setNuevoTestimonio] = useState({ cliente: '', comentario: '', rating: 5 });
  const [previewMode, setPreviewMode] = useState(false);

  const agregarServicio = () => {
    if (nuevoServicio.trim()) {
      const nuevosServicios = [...perfilData.servicios, nuevoServicio.trim()];
      setPerfilData(prev => ({ ...prev, servicios: nuevosServicios }));
      setNuevoServicio('');
    }
  };

  const eliminarServicio = (index) => {
    const nuevosServicios = perfilData.servicios.filter((_, i) => i !== index);
    setPerfilData(prev => ({ ...prev, servicios: nuevosServicios }));
  };

  const agregarCaracteristica = () => {
    if (nuevaCaracteristica.trim()) {
      const nuevasCaracteristicas = [...perfilData.caracteristicas, nuevaCaracteristica.trim()];
      setPerfilData(prev => ({ ...prev, caracteristicas: nuevasCaracteristicas }));
      setNuevaCaracteristica('');
    }
  };

  const eliminarCaracteristica = (index) => {
    const nuevasCaracteristicas = perfilData.caracteristicas.filter((_, i) => i !== index);
    setPerfilData(prev => ({ ...prev, caracteristicas: nuevasCaracteristicas }));
  };

  const agregarTestimonio = () => {
    if (nuevoTestimonio.cliente.trim() && nuevoTestimonio.comentario.trim()) {
      const nuevosTestimonios = [...perfilData.testimonios, { ...nuevoTestimonio }];
      setPerfilData(prev => ({ ...prev, testimonios: nuevosTestimonios }));
      setNuevoTestimonio({ cliente: '', comentario: '', rating: 5 });
    }
  };

  const eliminarTestimonio = (index) => {
    const nuevosTestimonios = perfilData.testimonios.filter((_, i) => i !== index);
    setPerfilData(prev => ({ ...prev, testimonios: nuevosTestimonios }));
  };

  const guardarPerfil = () => {
    Object.keys(perfilData).forEach(key => {
      onUpdate(key, perfilData[key]);
    });
    alert('Perfil web actualizado correctamente');
  };

  const formatearHorarios = () => {
    if (!empresa.horarios) return 'Horarios no definidos';
    
    const diasActivos = Object.entries(empresa.horarios)
      .filter(([_, horario]) => horario.activo)
      .map(([dia, horario]) => `${dia.charAt(0).toUpperCase() + dia.slice(1)}: ${horario.inicio} - ${horario.fin}`);
    
    return diasActivos.length > 0 ? diasActivos.join(', ') : 'Cerrado todos los días';
  };

  if (previewMode) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Vista Previa del Perfil Web</h3>
          <button
            onClick={() => setPreviewMode(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            ← Volver a Editar
          </button>
        </div>

        {/* Vista previa como aparecería en el sitio web */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg max-w-4xl mx-auto">
          {/* Header de la empresa */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
            <div className="flex items-center gap-6">
              {empresa.logo && (
                <img 
                  src={empresa.logo} 
                  alt={empresa.nombre}
                  className="w-20 h-20 bg-white rounded-lg p-2 object-contain"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold">{empresa.nombre}</h1>
                <p className="text-blue-100 mt-1">{empresa.categoria}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  {empresa.telefono && (
                    <span>📞 {empresa.telefono}</span>
                  )}
                  {empresa.email && (
                    <span>📧 {empresa.email}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="p-6 space-y-8">
            {/* Descripción */}
            {perfilData.descripcionCompleta && (
              <section>
                <h2 className="text-xl font-semibold mb-3">Acerca de Nosotros</h2>
                <p className="text-gray-700 leading-relaxed">{perfilData.descripcionCompleta}</p>
              </section>
            )}

            {/* Servicios */}
            {perfilData.servicios.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-3">Nuestros Servicios</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {perfilData.servicios.map((servicio, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-600">✓</span>
                      <span>{servicio}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Características */}
            {perfilData.caracteristicas.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-3">¿Por qué Elegirnos?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {perfilData.caracteristicas.map((caracteristica, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                      <span className="text-green-600">⭐</span>
                      <span>{caracteristica}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Horarios */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Horarios de Atención</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">{formatearHorarios()}</p>
              </div>
            </section>

            {/* Testimonios */}
            {perfilData.testimonios.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-3">Lo que Dicen Nuestros Clientes</h2>
                <div className="space-y-4">
                  {perfilData.testimonios.map((testimonio, index) => (
                    <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-lg ${i < testimonio.rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      <p className="text-gray-700 italic">"{testimonio.comentario}"</p>
                      <p className="text-gray-600 text-sm mt-2">- {testimonio.cliente}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Contacto */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Contacto</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {empresa.direccion && (
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span>{empresa.direccion}</span>
                    </div>
                  )}
                  {perfilData.contactoAdicional.whatsapp && (
                    <div className="flex items-center gap-2">
                      <span>📱</span>
                      <span>WhatsApp: {perfilData.contactoAdicional.whatsapp}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {perfilData.contactoAdicional.facebook && (
                    <div className="flex items-center gap-2">
                      <span>📘</span>
                      <span>Facebook: {perfilData.contactoAdicional.facebook}</span>
                    </div>
                  )}
                  {perfilData.contactoAdicional.instagram && (
                    <div className="flex items-center gap-2">
                      <span>📷</span>
                      <span>Instagram: {perfilData.contactoAdicional.instagram}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Perfil Web de la Empresa</h3>
          <p className="text-gray-600 text-sm mt-1">
            {empresa.web 
              ? 'Información adicional para complementar el sitio web existente' 
              : 'Crea un perfil web completo para empresas sin sitio web propio'
            }
          </p>
        </div>
        <button
          onClick={() => setPreviewMode(true)}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
        >
          👁️ Vista Previa
        </button>
      </div>

      <div className="space-y-8">
        {/* Descripción completa */}
        <section>
          <h4 className="font-medium text-gray-900 mb-3">Descripción Completa</h4>
          <textarea
            value={perfilData.descripcionCompleta}
            onChange={(e) => setPerfilData(prev => ({ ...prev, descripcionCompleta: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe detalladamente la empresa, su historia, misión, especialidades..."
          />
        </section>

        {/* Servicios */}
        <section>
          <h4 className="font-medium text-gray-900 mb-3">Servicios Ofrecidos</h4>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevoServicio}
                onChange={(e) => setNuevoServicio(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && agregarServicio()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Reparación de frenos, Venta de repuestos..."
              />
              <button
                onClick={agregarServicio}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Agregar
              </button>
            </div>
            
            <div className="space-y-2">
              {perfilData.servicios.map((servicio, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span>{servicio}</span>
                  <button
                    onClick={() => eliminarServicio(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Características distintivas */}
        <section>
          <h4 className="font-medium text-gray-900 mb-3">Características Distintivas</h4>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevaCaracteristica}
                onChange={(e) => setNuevaCaracteristica(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && agregarCaracteristica()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 20 años de experiencia, Garantía extendida..."
              />
              <button
                onClick={agregarCaracteristica}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Agregar
              </button>
            </div>
            
            <div className="space-y-2">
              {perfilData.caracteristicas.map((caracteristica, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span>{caracteristica}</span>
                  <button
                    onClick={() => eliminarCaracteristica(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contacto adicional */}
        <section>
          <h4 className="font-medium text-gray-900 mb-3">Información de Contacto Adicional</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
              <input
                type="text"
                value={perfilData.contactoAdicional.whatsapp}
                onChange={(e) => setPerfilData(prev => ({
                  ...prev,
                  contactoAdicional: { ...prev.contactoAdicional, whatsapp: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+56 9 1234 5678"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
              <input
                type="text"
                value={perfilData.contactoAdicional.facebook}
                onChange={(e) => setPerfilData(prev => ({
                  ...prev,
                  contactoAdicional: { ...prev.contactoAdicional, facebook: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="@empresapage"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
              <input
                type="text"
                value={perfilData.contactoAdicional.instagram}
                onChange={(e) => setPerfilData(prev => ({
                  ...prev,
                  contactoAdicional: { ...prev.contactoAdicional, instagram: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="@empresa"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dirección Completa</label>
              <input
                type="text"
                value={perfilData.contactoAdicional.direccionCompleta}
                onChange={(e) => setPerfilData(prev => ({
                  ...prev,
                  contactoAdicional: { ...prev.contactoAdicional, direccionCompleta: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Calle, número, comuna, región"
              />
            </div>
          </div>
        </section>

        {/* Testimonios */}
        <section>
          <h4 className="font-medium text-gray-900 mb-3">Testimonios de Clientes</h4>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <input
                  type="text"
                  value={nuevoTestimonio.cliente}
                  onChange={(e) => setNuevoTestimonio(prev => ({ ...prev, cliente: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre del cliente"
                />
                <select
                  value={nuevoTestimonio.rating}
                  onChange={(e) => setNuevoTestimonio(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5 estrellas</option>
                  <option value={4}>4 estrellas</option>
                  <option value={3}>3 estrellas</option>
                  <option value={2}>2 estrellas</option>
                  <option value={1}>1 estrella</option>
                </select>
                <button
                  onClick={agregarTestimonio}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Agregar
                </button>
              </div>
              <textarea
                value={nuevoTestimonio.comentario}
                onChange={(e) => setNuevoTestimonio(prev => ({ ...prev, comentario: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Comentario del cliente..."
              />
            </div>
            
            <div className="space-y-3">
              {perfilData.testimonios.map((testimonio, index) => (
                <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{testimonio.cliente}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`${i < testimonio.rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => eliminarTestimonio(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-gray-700">"{testimonio.comentario}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Botón guardar */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            onClick={guardarPerfil}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Guardar Perfil Web
          </button>
        </div>
      </div>
    </div>
  );
}
