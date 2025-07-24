import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AyudaAgentes() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            👥 Guía para Agentes de Campo
          </h1>
          <p className="text-xl text-gray-600">
            ¿Tienes problemas para acceder? Aquí te explicamos paso a paso
          </p>
        </div>

        {/* Flujo principal */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Agente nuevo */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-blue-200">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔑</div>
              <h2 className="text-2xl font-bold text-blue-800">Soy Agente Nuevo</h2>
              <p className="text-gray-600 mt-2">El admin me creó pero es mi primera vez</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-semibold">1</div>
                <div>
                  <p className="font-medium">El admin me creó en el sistema</p>
                  <p className="text-sm text-gray-600">Me proporcionó email y contraseña temporal</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-semibold">2</div>
                <div>
                  <p className="font-medium">Necesito completar mi registro</p>
                  <p className="text-sm text-gray-600">Solo la primera vez, después uso login normal</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-semibold">3</div>
                <div>
                  <p className="font-medium">Uso las credenciales temporales</p>
                  <p className="text-sm text-gray-600">Email y contraseña que me dio el admin</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/registro-agente')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Completar Registro Inicial
            </button>
          </div>

          {/* Agente existente */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-green-200">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-green-800">Ya soy Agente Activo</h2>
              <p className="text-gray-600 mt-2">Ya completé mi registro antes</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-semibold">1</div>
                <div>
                  <p className="font-medium">Ya tengo cuenta activa</p>
                  <p className="text-sm text-gray-600">Completé el registro inicial anteriormente</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-semibold">2</div>
                <div>
                  <p className="font-medium">Uso login normal</p>
                  <p className="text-sm text-gray-600">Como cualquier usuario del sistema</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-semibold">3</div>
                <div>
                  <p className="font-medium">Accedo a mi panel de agente</p>
                  <p className="text-sm text-gray-600">Puedo crear solicitudes de empresas</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Iniciar Sesión Normal
            </button>
          </div>
        </div>

        {/* Errores comunes */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            🚨 Errores Comunes y Soluciones
          </h3>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-red-600 mb-4">❌ "Email ya registrado pero la contraseña no coincide"</h4>
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  <strong>Causa:</strong> Estás usando "Registro de Agente" cuando ya tienes cuenta activa.
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Solución:</strong> Usa el login normal con tu contraseña habitual.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-red-100 text-red-700 px-4 py-2 rounded text-sm hover:bg-red-200"
                >
                  Ir al Login Normal
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-orange-600 mb-4">⚠️ "Email no encontrado en el sistema"</h4>
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  <strong>Causa:</strong> El admin no te ha creado como agente aún.
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Solución:</strong> Contacta al administrador para que te agregue.
                </p>
                <div className="bg-orange-100 text-orange-700 px-3 py-2 rounded text-sm">
                  📞 Contacta al administrador del sistema
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-blue-600 mb-4">🔐 "Contraseña no coincide con la temporal"</h4>
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  <strong>Causa:</strong> La contraseña que ingresaste no es la que te dio el admin.
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Solución:</strong> Verifica las credenciales o contacta al admin.
                </p>
                <div className="bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm">
                  📝 Verifica email y contraseña temporal
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-green-600 mb-4">✅ "Ya tienes cuenta registrada"</h4>
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  <strong>Causa:</strong> Tu registro ya fue completado anteriormente.
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Solución:</strong> Usa el login normal, no el registro.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-green-100 text-green-700 px-4 py-2 rounded text-sm hover:bg-green-200"
                >
                  Ir al Login Normal
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl shadow-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">¿Sigues teniendo problemas?</h3>
          <p className="text-blue-100 mb-6">
            Si después de seguir esta guía aún no puedes acceder, contacta al administrador del sistema.
          </p>
          <div className="space-y-2">
            <p className="text-sm">📧 Incluye tu email en el mensaje</p>
            <p className="text-sm">🔍 Describe el error específico que ves</p>
            <p className="text-sm">📱 Menciona si eres agente nuevo o existente</p>
          </div>
        </div>

        {/* Navegación */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800 underline"
          >
            ← Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
