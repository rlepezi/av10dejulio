import React from "react";

export default function MasInformacionProveedorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-green-100 py-10">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">
          Más Información para Proveedores
        </h1>
        <p className="mb-4 text-lg">
          Aquí encontrarás toda la información relevante sobre:
        </p>
        <ul className="list-disc ml-6 mb-6 text-lg text-blue-900">
          <li>Cómo postular tu empresa</li>
          <li>Cómo enviar campañas y productos</li>
          <li>Requisitos y políticas para proveedores</li>
          <li>Beneficios de pertenecer a la plataforma</li>
          <li>Preguntas frecuentes</li>
        </ul>
        <p className="text-gray-700">
          Si tienes dudas adicionales, escríbenos a <a className="text-blue-700 underline" href="mailto:soporte@tuplataforma.com">soporte@tuplataforma.com</a>
        </p>
      </div>
    </div>
  );
}