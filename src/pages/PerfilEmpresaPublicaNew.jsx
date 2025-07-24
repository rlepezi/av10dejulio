import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function PerfilEmpresaPublica() {
  const { empresaId } = useParams();
  const [empresa, setEmpresa] = useState(null);
  const [productos, setProductos] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    fetchEmpresa();
    fetchProductos();
    fetchCampanas();
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

  const fetchProductos = async () => {
    try {
      const q = query(
        collection(db, 'productos'), 
        where('empresaId', '==', empresaId)
      );
      const querySnapshot = await getDocs(q);
      const productosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProductos(productosData);
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const fetchCampanas = async () => {
    try {
      const q = query(
        collection(db, 'campañas'), 
        where('empresaId', '==', empresaId)
      );
      const querySnapshot = await getDocs(q);
      const campanasData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCampanas(campanasData);
    } catch (error) {
      console.error('Error cargando campañas:', error);
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

  const abrirMapa = () => {
    if (empresa.direccion) {
      const direccionEncoded = encodeURIComponent(empresa.direccion);
      window.open(`https://www.google.com/maps/search/?api=1&query=${direccionEncoded}`, '_blank');
    }
  };

  const getImagePath = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `/images/${imagePath}`;
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
  if (empresa.web && !window.location.hash) {
    window.location.href = empresa.web.startsWith('http') ? empresa.web : `https://${empresa.web}`;
    return null;
  }

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
                    <span>{empresa.telefono}</span>
                  </div>
                )}
                {empresa.email && (
                  <div className="flex items-center gap-2 bg-blue-700 bg-opacity-50 px-4 py-2 rounded-full backdrop-blur-sm">
                    <span>📧</span>
                    <span>{empresa.email}</span>
                  </div>
                )}
              </div>
              
              {/* Dirección con botón de mapa */}
              {empresa.direccion && (
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex items-center gap-2 text-blue-100">
                    <span>📍</span>
                    <span>{empresa.direccion}</span>
                  </div>
                  <button
                    onClick={abrirMapa}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    🗺️ Ver en Mapa
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${ 
                activeTab === 'info'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📋 Información
            </button>
            {productos.length > 0 && (
              <button
                onClick={() => setActiveTab('productos')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'productos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                🛍️ Productos ({productos.length})
              </button>
            )}
            {campanas.length > 0 && (
              <button
                onClick={() => setActiveTab('campanas')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'campanas'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                🎯 Ofertas ({campanas.length})
              </button>
            )}
            <button
              onClick={() => setActiveTab('contacto')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contacto'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📞 Contacto
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Pestaña de Información */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna principal */}
            <div className="lg:col-span-2 space-y-8">
              {/* Descripción */}
              {(empresa.descripcionCompleta || empresa.descripcion) && (
                <section className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Acerca de Nosotros</h2>
                  <p className="text-gray-700 leading-relaxed text-lg">
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

              {/* Galería de fotos */}
              {empresa.galeria && empresa.galeria.length > 0 && (
                <section className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Galería</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {empresa.galeria.map((imagen, index) => (
                      <div 
                        key={index} 
                        className="relative group cursor-pointer"
                        onClick={() => abrirImagen(getImagePath(imagen))}
                      >
                        <img
                          src={getImagePath(imagen)}
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
            </div>

            {/* Sidebar para la pestaña de información */}
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

              {/* Ubicación y mapa */}
              {empresa.direccion && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>📍</span>
                    Ubicación
                  </h3>
                  <p className="text-gray-700 mb-4">{empresa.direccion}</p>
                  <button
                    onClick={abrirMapa}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    🗺️ Abrir en Google Maps
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pestaña de Productos */}
        {activeTab === 'productos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productos.map((producto) => (
              <div key={producto.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {producto.imagen && (
                  <img
                    src={getImagePath(producto.imagen)}
                    alt={producto.nombre}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2">{producto.nombre}</h3>
                  {producto.descripcion && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{producto.descripcion}</p>
                  )}
                  {producto.precio && (
                    <p className="text-xl font-bold text-green-600">${producto.precio.toLocaleString()}</p>
                  )}
                  {producto.categoria && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-2">
                      {producto.categoria}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pestaña de Campañas */}
        {activeTab === 'campanas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campanas.map((campana) => (
              <div key={campana.id} className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg overflow-hidden text-white">
                {campana.imagen && (
                  <img
                    src={getImagePath(campana.imagen)}
                    alt={campana.titulo}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-3">{campana.titulo}</h3>
                  {campana.descripcion && (
                    <p className="text-purple-100 mb-4">{campana.descripcion}</p>
                  )}
                  {campana.descuento && (
                    <div className="bg-yellow-400 text-purple-900 px-4 py-2 rounded-lg font-bold text-lg mb-4">
                      {campana.descuento}% OFF
                    </div>
                  )}
                  {campana.fechaFin && (
                    <p className="text-purple-200 text-sm">
                      Válido hasta: {new Date(campana.fechaFin.seconds * 1000).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pestaña de Contacto */}
        {activeTab === 'contacto' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Información de contacto */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Información de Contacto</h3>
                <div className="space-y-4">
                  {empresa.telefono && (
                    <div className="flex items-center gap-3">
                      <span className="text-green-600 text-xl">📱</span>
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
                      <span className="text-blue-600 text-xl">📧</span>
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
                      <span className="text-green-600 text-xl">💬</span>
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
                    <div className="flex items-start gap-3">
                      <span className="text-red-600 text-xl">📍</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Dirección</p>
                        <p className="font-medium text-gray-800 mb-2">{empresa.direccion}</p>
                        <button
                          onClick={abrirMapa}
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          Ver en Google Maps
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Horarios detallados */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Horarios de Atención</h3>
              <div className="space-y-3">
                {formatearHorarios().split('\n').map((linea, index) => {
                  const [dia, horario] = linea.split(':');
                  const esCerrado = horario.trim() === 'Cerrado';
                  return (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <span className="font-medium text-gray-700">{dia}:</span>
                      <span className={`${esCerrado ? 'text-red-600' : 'text-green-600'} font-medium`}>
                        {horario.trim()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
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
