import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function PerfilEmpresaPublico() {
  const { empresaId } = useParams();
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmpresa();
  }, [empresaId]);

  const fetchEmpresa = async () => {
    try {
      const docRef = doc(db, 'empresas', empresaId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const empresaData = { id: docSnap.id, ...docSnap.data() };
        
        // Solo mostrar empresas activas o si no tienen web propia
        if (empresaData.estado === 'activa') {
          setEmpresa(empresaData);
        } else {
          setError('Esta empresa no está disponible públicamente');
        }
      } else {
        setError('Empresa no encontrada');
      }
    } catch (error) {
      console.error('Error cargando empresa:', error);
      setError('Error al cargar la información de la empresa');
    } finally {
      setLoading(false);
    }
  };

  const getImagePath = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `/images/${imagePath}`;
  };

  const formatearHorarios = () => {
    if (!empresa?.horarios) return 'Horarios no disponibles';
    
    const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    
    return diasSemana.map((dia, index) => {
      const horario = empresa.horarios[dia];
      if (!horario || !horario.abierto) {
        return `${nombresDias[index]}: Cerrado`;
      }
      if (horario.turno_continuo) {
        return `${nombresDias[index]}: ${horario.apertura} - ${horario.cierre}`;
      } else {
        return `${nombresDias[index]}: ${horario.apertura}-${horario.descanso_inicio} | ${horario.descanso_fin}-${horario.cierre}`;
      }
    }).join('\n');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil de empresa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">⚠️ Error</h2>
            <p className="text-red-700">{error}</p>
            <button 
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!empresa) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de la empresa */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white relative">
        {/* Imagen de fondo del local si existe */}
        {empresa.imagenLocal && (
          <div className="absolute inset-0 opacity-20">
            <img 
              src={getImagePath(empresa.imagenLocal)} 
              alt="Local"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="relative max-w-6xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Logo destacado */}
            {empresa.logo && (
              <div className="flex-shrink-0">
                <img 
                  src={getImagePath(empresa.logo)} 
                  alt={empresa.nombre}
                  className="w-40 h-40 bg-white rounded-xl p-4 object-contain shadow-2xl border-4 border-white"
                />
              </div>
            )}
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">{empresa.nombre}</h1>
              {empresa.categoria && (
                <p className="text-xl text-blue-100 mb-4 drop-shadow">{empresa.categoria}</p>
              )}
              
              {/* Información de contacto destacada */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm mb-6">
                {empresa.telefono && (
                  <div className="flex items-center gap-2 bg-blue-700 bg-opacity-50 px-4 py-2 rounded-full backdrop-blur-sm">
                    <span>📞</span>
                    <a href={`tel:${empresa.telefono}`} className="hover:underline">
                      {empresa.telefono}
                    </a>
                  </div>
                )}
                {empresa.email && (
                  <div className="flex items-center gap-2 bg-blue-700 bg-opacity-50 px-4 py-2 rounded-full backdrop-blur-sm">
                    <span>📧</span>
                    <a href={`mailto:${empresa.email}`} className="hover:underline truncate">
                      {empresa.email}
                    </a>
                  </div>
                )}
                {empresa.direccion && (
                  <div className="flex items-center gap-2 bg-blue-700 bg-opacity-50 px-4 py-2 rounded-full backdrop-blur-sm">
                    <span>📍</span>
                    <span className="truncate">{empresa.direccion}</span>
                  </div>
                )}
              </div>
              
              {/* Estado de la empresa */}
              <div className="flex justify-center md:justify-start">
                <span className="bg-green-500 bg-opacity-80 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  ✅ Empresa Verificada
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Descripción */}
            {(empresa.descripcionCompleta || empresa.descripcion) && (
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acerca de Nosotros</h2>
                <p className="text-gray-700 leading-relaxed">
                  {empresa.descripcionCompleta || empresa.descripcion}
                </p>
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

            {/* Marcas que trabajamos */}
            {empresa.marcas && empresa.marcas.length > 0 && (
              <section className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">🚗 Marcas que Trabajamos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {empresa.marcas.map((marca, index) => (
                    <div key={index} className="flex items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <span className="font-medium text-gray-700 text-center">{marca}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Galería de fotos */}
            {empresa.galeria && empresa.galeria.length > 0 && (
              <section className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">📸 Nuestra Galería</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {empresa.galeria.map((foto, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden shadow-sm">
                      <img 
                        src={getImagePath(foto)} 
                        alt={`Foto ${index + 1} de ${empresa.nombre}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(getImagePath(foto), '_blank')}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Características distintivas */}
            {empresa.caracteristicas && empresa.caracteristicas.length > 0 && (
              <section className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">⭐ ¿Por qué Elegirnos?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {empresa.caracteristicas.map((caracteristica, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <span className="text-green-600 text-xl">⭐</span>
                      <span className="font-medium text-gray-800">{caracteristica}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Testimonios */}
            {empresa.testimonios && empresa.testimonios.length > 0 && (
              <section className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">💬 Lo que Dicen Nuestros Clientes</h2>
                <div className="space-y-4">
                  {empresa.testimonios.map((testimonio, index) => (
                    <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-xl ${i < testimonio.rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      <p className="text-gray-700 italic mb-3 text-lg">"{testimonio.comentario}"</p>
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
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>�</span>
                Horarios de Atención
              </h3>
              <div className="space-y-2">
                <pre className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                  {formatearHorarios()}
                </pre>
              </div>
            </div>

            {/* Información de contacto */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📞</span>
                Contacto
              </h3>
              <div className="space-y-4">
                {empresa.telefono && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-600 text-xl">📱</span>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Teléfono</p>
                      <a href={`tel:${empresa.telefono}`} className="text-blue-600 hover:underline font-medium">
                        {empresa.telefono}
                      </a>
                    </div>
                  </div>
                )}
                
                {empresa.email && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <span className="text-green-600 text-xl">📧</span>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
                      <a href={`mailto:${empresa.email}`} className="text-green-600 hover:underline font-medium">
                        {empresa.email}
                      </a>
                    </div>
                  </div>
                )}

                {empresa.contactoAdicional?.whatsapp && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <span className="text-green-600 text-xl">💬</span>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">WhatsApp</p>
                      <a 
                        href={`https://wa.me/${empresa.contactoAdicional.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline font-medium"
                      >
                        {empresa.contactoAdicional.whatsapp}
                      </a>
                    </div>
                  </div>
                )}

                {empresa.direccion && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-xl mt-1">📍</span>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Dirección</p>
                      <p className="text-gray-700 font-medium">{empresa.direccion}</p>
                      {empresa.contactoAdicional?.direccionCompleta && 
                       empresa.contactoAdicional.direccionCompleta !== empresa.direccion && (
                        <p className="text-gray-600 text-sm mt-1">
                          {empresa.contactoAdicional.direccionCompleta}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Redes sociales */}
            {(empresa.contactoAdicional?.facebook || empresa.contactoAdicional?.instagram || empresa.web) && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🌐</span>
                  Síguenos
                </h3>
                <div className="space-y-3">
                  {empresa.web && (
                    <a
                      href={empresa.web.startsWith('http') ? empresa.web : `https://${empresa.web}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                    >
                      <span className="text-blue-600 text-xl">🌍</span>
                      <span className="text-blue-600 hover:underline font-medium">Sitio Web</span>
                    </a>
                  )}
                  
                  {empresa.contactoAdicional?.facebook && (
                    <a
                      href={`https://facebook.com/${empresa.contactoAdicional.facebook.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                    >
                      <span className="text-blue-600 text-xl">📘</span>
                      <span className="text-blue-600 hover:underline font-medium">Facebook</span>
                    </a>
                  )}
                  
                  {empresa.contactoAdicional?.instagram && (
                    <a
                      href={`https://instagram.com/${empresa.contactoAdicional.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                    >
                      <span className="text-pink-600 text-xl">📷</span>
                      <span className="text-pink-600 hover:underline font-medium">Instagram</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Información adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                💡 <strong>¿Eres el dueño de esta empresa?</strong>
              </p>
              <p className="text-blue-700 text-sm mt-1">
                <a href="/contacto" className="underline hover:text-blue-900">
                  Contáctanos
                </a> para actualizar o reclamar este perfil.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer simple */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-300">
            Perfil empresarial proporcionado por <strong>AV10 de Julio</strong>
          </p>
        </div>
      </footer>
    </div>
  );
}
