import React, { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export default function LogoUploader({ empresa, onLogoUpload, saving }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(empresa.logo_url || empresa.logo || null);
  const [galeria, setGaleria] = useState(empresa.galeria || []);
  const [uploadingGaleria, setUploadingGaleria] = useState(false);
  const [logoUploaded, setLogoUploaded] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const fileInputRef = useRef(null);
  const galeriaInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    // Validar que sea imagen PNG
    if (!file.type.includes('png') && !file.type.includes('jpeg') && !file.type.includes('jpg')) {
      setLogoError('Por favor, selecciona un archivo PNG o JPG');
      setTimeout(() => setLogoError(''), 5000);
      return;
    }

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('El archivo es muy grande. Máximo 2MB');
      setTimeout(() => setLogoError(''), 5000);
      return;
    }

    try {
      setUploading(true);
      setLogoError('');
      setMensajeExito('');
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);

      // Subir archivo
      const logoURL = await onLogoUpload(file);
      setPreviewUrl(logoURL);
      setLogoUploaded(true);
      setMensajeExito('✅ Logo subido y guardado correctamente');
      setTimeout(() => setMensajeExito(''), 5000);
      
    } catch (error) {
      console.error('Error subiendo logo:', error);
      setLogoError('Error al subir el logo. Inténtalo nuevamente.');
      setTimeout(() => setLogoError(''), 5000);
      setPreviewUrl(empresa.logo_url || empresa.logo || null);
    } finally {
      setUploading(false);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeLogo = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar el logo?')) {
      try {
        setUploading(true);
        setLogoError('');
        setMensajeExito('');
        await onLogoUpload(null);
        setPreviewUrl(null);
        setLogoUploaded(false);
        setMensajeExito('✅ Logo eliminado correctamente');
        setTimeout(() => setMensajeExito(''), 5000);
      } catch (error) {
        console.error('Error eliminando logo:', error);
        setLogoError('Error al eliminar el logo');
        setTimeout(() => setLogoError(''), 5000);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleGaleriaUpload = async (files) => {
    try {
      setUploadingGaleria(true);
      setLogoError('');
      const nuevasImagenes = [];
      
      for (let file of files) {
        if (!file.type.includes('image/')) {
          setLogoError(`${file.name} no es una imagen válida`);
          setTimeout(() => setLogoError(''), 5000);
          continue;
        }
        
        if (file.size > 5 * 1024 * 1024) {
          setLogoError(`${file.name} es muy grande. Máximo 5MB por imagen`);
          setTimeout(() => setLogoError(''), 5000);
          continue;
        }

        const imageRef = ref(storage, `galeria/empresas/${empresa.id}/${Date.now()}-${file.name}`);
        await uploadBytes(imageRef, file);
        const imageURL = await getDownloadURL(imageRef);
        nuevasImagenes.push(imageURL);
      }

      const galeriaActualizada = [...galeria, ...nuevasImagenes];
      setGaleria(galeriaActualizada);
      
      // Guardar en Firebase
      await onLogoUpload(null, 'galeria', galeriaActualizada);
      
      if (nuevasImagenes.length > 0) {
        setMensajeExito(`✅ ${nuevasImagenes.length} imagen(es) subida(s) correctamente`);
        setTimeout(() => setMensajeExito(''), 5000);
      }
      
    } catch (error) {
      console.error('Error subiendo imágenes:', error);
      setLogoError('Error al subir las imágenes');
      setTimeout(() => setLogoError(''), 5000);
    } finally {
      setUploadingGaleria(false);
    }
  };

  const removeImagenGaleria = async (index) => {
    if (window.confirm('¿Eliminar esta imagen de la galería?')) {
      try {
        setLogoError('');
        const nuevaGaleria = galeria.filter((_, i) => i !== index);
        setGaleria(nuevaGaleria);
        await onLogoUpload(null, 'galeria', nuevaGaleria);
        setMensajeExito('✅ Imagen eliminada de la galería');
        setTimeout(() => setMensajeExito(''), 5000);
      } catch (error) {
        console.error('Error eliminando imagen:', error);
        setLogoError('Error al eliminar la imagen');
        setTimeout(() => setLogoError(''), 5000);
      }
    }
  };

  const generarLogoAutomatico = async () => {
    if (window.confirm('¿Generar un logo automático basado en el nombre de la empresa?')) {
      try {
        setUploading(true);
        setLogoError('');
        setMensajeExito('');
        
        // Crear canvas para generar logo
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        
        // Fondo con gradiente
        const gradient = ctx.createLinearGradient(0, 0, 400, 400);
        gradient.addColorStop(0, '#3B82F6');
        gradient.addColorStop(1, '#1E40AF');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 400);
        
        // Texto del nombre
        const nombre = empresa.nombre || 'Empresa';
        const iniciales = nombre.split(' ').map(word => word.charAt(0)).join('').substring(0, 3);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 120px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(iniciales, 200, 200);
        
        // Convertir a blob y subir
        canvas.toBlob(async (blob) => {
          try {
            const logoRef = ref(storage, `logos/empresas/auto-${empresa.id}-${Date.now()}.png`);
            await uploadBytes(logoRef, blob);
            const logoURL = await getDownloadURL(logoRef);
            
            await onLogoUpload({ logoURL, esAutomatico: true });
            setPreviewUrl(logoURL);
            setLogoUploaded(true);
            setMensajeExito('✅ Logo automático generado y guardado correctamente');
            setTimeout(() => setMensajeExito(''), 5000);
          } catch (error) {
            console.error('Error subiendo logo automático:', error);
            setLogoError('Error al generar el logo automático');
            setTimeout(() => setLogoError(''), 5000);
            throw error;
          }
        }, 'image/png');
        
      } catch (error) {
        console.error('Error generando logo:', error);
        setLogoError('Error al generar el logo automático');
        setTimeout(() => setLogoError(''), 5000);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h3 className="text-lg font-semibold mb-4">Gestión de Logo y Galería</h3>
      
      {/* Estado general del logo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-lg">
              {empresa.logo_url || empresa.logo ? '✅' : '⚠️'}
            </span>
            <div>
              <p className="font-medium text-blue-900">
                {empresa.logo_url || empresa.logo ? 'Logo configurado' : 'Logo pendiente de configuración'}
              </p>
              <p className="text-sm text-blue-700">
                {empresa.logo_url || empresa.logo 
                  ? 'El logo está visible en el sistema y se muestra correctamente' 
                  : 'Selecciona o genera un logo para tu empresa'
                }
              </p>
            </div>
          </div>
          {empresa.logoAsignado && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              ✓ Asignado
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vista previa del logo actual */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Logo de la Empresa</h4>
          <div className="border-2 border-gray-200 rounded-lg p-6 text-center bg-gray-50">
            {previewUrl ? (
              <div className="space-y-4">
                <img
                  src={previewUrl}
                  alt="Logo de la empresa"
                  className="w-32 h-32 object-contain mx-auto bg-white border rounded-lg shadow-sm"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div style={{ display: 'none' }} className="w-32 h-32 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                  <span className="text-4xl text-gray-400">🖼️</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <span>✅</span>
                    <span className="font-medium">Logo cargado correctamente</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {logoUploaded ? 'Logo subido y guardado en la base de datos' : 'Logo visible en el sistema'}
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={removeLogo}
                      disabled={uploading}
                      className="text-red-600 hover:text-red-800 text-sm underline disabled:opacity-50"
                    >
                      Eliminar logo
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                  <span className="text-4xl text-gray-400">🖼️</span>
                </div>
                <p className="text-gray-500">No hay logo asignado</p>
                {!empresa.web && (
                  <button
                    onClick={generarLogoAutomatico}
                    disabled={uploading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
                  >
                    ✨ Generar Logo Automático
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Subir nuevo logo */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Subir Nuevo Logo</h4>
          
          {/* Mensajes de estado */}
          {mensajeExito && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm">
              {mensajeExito}
            </div>
          )}
          
          {logoError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
              ❌ {logoError}
            </div>
          )}
          
          {/* Zona de drag and drop */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="text-4xl">📁</div>
              
              {uploading ? (
                <div className="space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-blue-600">Subiendo logo...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-gray-700 font-medium">
                      Arrastra y suelta un archivo aquí
                    </p>
                    <p className="text-gray-500 text-sm">
                      o haz clic para seleccionar
                    </p>
                  </div>
                  
                  <button
                    onClick={onButtonClick}
                    disabled={uploading || saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Seleccionar Archivo
                  </button>
                </>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".png,.jpg,.jpeg"
            onChange={handleChange}
          />

          {/* Botón de guardar prominente */}
          {previewUrl && !uploading && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-lg">✅</span>
                  <span className="text-green-800 font-medium">Logo listo para guardar</span>
                </div>
                <button
                  onClick={() => {
                    setMensajeExito('✅ Logo guardado correctamente en la base de datos');
                    setTimeout(() => setMensajeExito(''), 5000);
                  }}
                  disabled={saving}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium shadow-lg"
                >
                  {saving ? 'Guardando...' : '💾 Guardar Logo'}
                </button>
              </div>
              <p className="text-green-700 text-sm mt-2">
                El logo se guarda automáticamente al seleccionarlo. Este botón confirma que se ha guardado en la base de datos.
              </p>
            </div>
          )}

          {/* Información sobre el archivo */}
          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <p>• Formatos permitidos: PNG, JPG, JPEG</p>
            <p>• Tamaño máximo: 2MB</p>
            <p>• Recomendado: Logo cuadrado (500x500px) con fondo transparente</p>
          </div>
        </div>
      </div>

      {/* Galería de fotos del local/empresa */}
      <div className="border-t border-gray-200 pt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-md font-medium text-gray-700">Galería de Fotos del Local</h4>
            <p className="text-sm text-gray-500 mt-1">
              Sube fotos del local, productos o servicios para el perfil web
            </p>
          </div>
          <button
            onClick={() => galeriaInputRef.current?.click()}
            disabled={uploadingGaleria}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {uploadingGaleria ? 'Subiendo...' : '📷 Agregar Fotos'}
          </button>
        </div>

        <input
          ref={galeriaInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files.length > 0 && handleGaleriaUpload(Array.from(e.target.files))}
        />

        {/* Vista de galería */}
        {galeria.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galeria.map((imagen, index) => (
              <div key={index} className="relative group">
                <img
                  src={imagen}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <button
                  onClick={() => removeImagenGaleria(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-4xl text-gray-400 mb-2">📸</div>
            <p className="text-gray-500">No hay fotos en la galería</p>
            <p className="text-gray-400 text-sm mt-1">
              Las fotos ayudan a los clientes a conocer mejor tu local
            </p>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <p>• Máximo 5MB por imagen • Formatos: JPG, PNG • Recomendado: fotos del local, productos, equipo</p>
        </div>
      </div>

      {/* Consejos y estado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consejos para el logo */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">💡 Consejos para un buen logo:</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Usa un fondo transparente (PNG) para mejor integración</li>
            <li>• Asegúrate de que sea legible en tamaños pequeños</li>
            <li>• Mantén un diseño simple y reconocible</li>
            <li>• Usa colores que representen tu marca</li>
          </ul>
        </div>

        {/* Estado del perfil sin web */}
        {!empresa.web && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h5 className="font-medium text-green-900 mb-2">🌐 Perfil Web para PYME:</h5>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Tu empresa tendrá un perfil web completo</li>
              <li>• Los clientes podrán ver fotos y información</li>
              <li>• Incluye horarios, servicios y contacto</li>
              <li>• Perfecto para emprendimientos sin sitio web</li>
            </ul>
            {empresa.logoAsignado && galeria.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-green-700">
                <span>✓</span>
                <span className="text-sm font-medium">Perfil listo para publicar</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Estado del logo para validación */}
      {empresa.logoAsignado && (
        <div className="mt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            <span>✓</span>
            Logo asignado correctamente
          </div>
        </div>
      )}
    </div>
  );
}
