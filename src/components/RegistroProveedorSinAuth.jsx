import React from "react";

export default function RegistroProveedorSinAuth() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Registro de Proveedor
        </h2>
        <p className="text-gray-600 mb-4">
          Debes iniciar sesión para completar el registro de proveedor.
        </p>
        <a href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Iniciar Sesión
        </a>
      </div>
    </div>
  );
}
