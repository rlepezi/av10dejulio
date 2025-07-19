import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function PerfilEmpresaPublica() {
  const { empresaId } = useParams();
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);

  useEffect(() => {
    fetchEmpresa();
  }, [empresaId]);

  const fetchEmpresa = async () => {
    try {
      const docRef = doc(db, 'empresas', empresaId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const empresaData = { id: docSnap.id, ...docSnap.data() };
        setEmpresa(empresaData);
      } else {
        setError('Empresa no encontrada');
      }
    } catch (error) {
      console.error('Error cargando empresa:', error);
      setError('Error al cargar la empresa');
    } finally {
      setLoading(false);
    }
  };

  const formatearHorarios = () => {
    if (!empresa.horarios) return 'Horarios no definidos';
    
    const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    return diasSemana.map((dia, index) => {
      const horario = empresa.horarios[dia];
      if (!horario || !horario.activo) {
        return `${nombresDias[index]}: Cerrado`;
      }
      return `${nombresDias[index]}: ${horario.inicio} - ${horario.fin}`;
    }).join('\n');
  };

  const abrirImagen = (imagen) => {
    setImagenSeleccionada(imagen);
  };

  const cerrarModal = () => {
    setImagenSeleccionada(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !empresa) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="text-6xl mb-4">🏢</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Empresa no encontrada</h1>
          <p className="text-gray-600">La empresa que buscas no existe o no está disponible.</p>
        </div>
      </div>
    );
  }

  // Si la empresa tiene sitio web, redirigir
  if (empresa.web) {
    window.location.href = empresa.web.startsWith('http') ? empresa.web : `https://${empresa.web}`;
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de la empresa */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {empresa.logo && (
              <div className="flex-shrink-0">
                <img 
                  src={empresa.logo} 
                  alt={empresa.nombre}
                  className="w-32 h-32 bg-white rounded-xl p-4 object-contain shadow-lg"
                />
              </div>
            )}
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{empresa.nombre}</h1>
              {empresa.categoria && (
                <p className="text-xl text-blue-100 mb-4">{empresa.categoria}</p>
              )}
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                {empresa.telefono && (
                  <div className="flex items-center gap-2 bg-blue-700 bg-opacity-50 px-3 py-1 rounded-full">
                    <span>📞</span>
                    <span>{empresa.telefono}</span>
                  </div>
                )}
                {empresa.email && (
                  <div className="flex items-center gap-2 bg-blue-700 bg-opacity-50 px-3 py-1 rounded-full">
                    <span>📧</span>
                    <span>{empresa.email}</span>
                  </div>
                )}
                {empresa.direccion && (
                  <div className="flex items-center gap-2 bg-blue-700 bg-opacity-50 px-3 py-1 rounded-full">
                    <span>📍</span>
                    <span>{empresa.direccion}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Descripción */}
            {empresa.descripcionCompleta && (
              <section className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Acerca de Nosotros</h2>
                <p className="text-gray-700 leading-relaxed text-lg">{empresa.descripcionCompleta}</p>
              </section>
            )}

            {/* Servicios */}
            {empresa.servicios && empresa.servicios.length > 0 && (
              <section className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Nuestros Servicios</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {empresa.servicios.map((servicio, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <span className="text-blue-600 text-xl">✓</span>
                      <span className="font-medium text-gray-800">{servicio}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Galería de fotos */}
            {empresa.galeria && empresa.galeria.length > 0 && (
              <section className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Galería</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {empresa.galeria.map((imagen, index) => (
                    <div 
                      key={index} 
                      className="relative group cursor-pointer"
                      onClick={() => abrirImagen(imagen)}
                    >
                      <img
                        src={imagen}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                        <span className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity">🔍</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Características distintivas */}
            {empresa.caracteristicas && empresa.caracteristicas.length > 0 && (
              <section className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">¿Por qué Elegirnos?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {empresa.caracteristicas.map((caracteristica, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="text-green-600 text-xl">⭐</span>
                      <span className="text-gray-800">{caracteristica}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Testimonios */}
            {empresa.testimonios && empresa.testimonios.length > 0 && (
              <section className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Lo que Dicen Nuestros Clientes</h2>
                <div className="space-y-6">
                  {empresa.testimonios.map((testimonio, index) => (
                    <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-2xl ${i < testimonio.rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      <p className="text-gray-700 italic text-lg mb-3">"{testimonio.comentario}"</p>
                      <p className="text-gray-600 font-medium">- {testimonio.cliente}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Horarios */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🕒</span>
                Horarios de Atención
              </h3>
              <div className="space-y-2 text-sm">
                {formatearHorarios().split('\n').map((linea, index) => (
                  <div key={index} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                    <span className="font-medium text-gray-700">{linea.split(':')[0]}:</span>
                    <span className="text-gray-600">{linea.split(':').slice(1).join(':').trim()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contacto */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📞</span>
                Contacto
              </h3>
              <div className="space-y-4">
                {empresa.telefono && (
                  <div className="flex items-center gap-3">
                    <span className="text-green-600">📱</span>
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <a href={`tel:${empresa.telefono}`} className="font-medium text-blue-600 hover:text-blue-800">
                        {empresa.telefono}
                      </a>
                    </div>
                  </div>
                )}
                
                {empresa.email && (
                  <div className="flex items-center gap-3">
                    <span className="text-blue-600">📧</span>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <a href={`mailto:${empresa.email}`} className="font-medium text-blue-600 hover:text-blue-800">
                        {empresa.email}
                      </a>
                    </div>
                  </div>
                )}

                {empresa.contactoAdicional?.whatsapp && (
                  <div className="flex items-center gap-3">
                    <span className="text-green-600">💬</span>
                    <div>
                      <p className="text-sm text-gray-600">WhatsApp</p>
                      <a 
                        href={`https://wa.me/${empresa.contactoAdicional.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-green-600 hover:text-green-800"
                      >
                        {empresa.contactoAdicional.whatsapp}
                      </a>
                    </div>
                  </div>
                )}

                {empresa.direccion && (
                  <div className="flex items-center gap-3">
                    <span className="text-red-600">📍</span>
                    <div>
                      <p className="text-sm text-gray-600">Dirección</p>
                      <p className="font-medium text-gray-800">{empresa.direccion}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Redes sociales */}
            {(empresa.contactoAdicional?.facebook || empresa.contactoAdicional?.instagram) && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🌐</span>
                  Síguenos
                </h3>
                <div className="space-y-3">
                  {empresa.contactoAdicional.facebook && (
                    <a 
                      href={`https://facebook.com/${empresa.contactoAdicional.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <span className="text-blue-600">📘</span>
                      <span className="font-medium text-blue-800">Facebook</span>
                    </a>
                  )}
                  {empresa.contactoAdicional.instagram && (
                    <a 
                      href={`https://instagram.com/${empresa.contactoAdicional.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
                    >
                      <span className="text-pink-600">📷</span>
                      <span className="font-medium text-pink-800">Instagram</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para imagen ampliada */}
      {imagenSeleccionada && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={cerrarModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={imagenSeleccionada}
              alt="Imagen ampliada"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={cerrarModal}
              className="absolute top-4 right-4 bg-white bg-opacity-20 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            Perfil empresarial de {empresa.nombre} • Plataforma AV10deJulio
          </p>
        </div>
      </footer>
    </div>
  );
}
