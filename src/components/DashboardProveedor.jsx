import React from "react";
import { useNavigate } from "react-router-dom";

export default function DashboardProveedor() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-green-100 py-10">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <h2 className="text-3xl font-bold text-blue-900 mb-6 text-center">
          Panel del Proveedor
        </h2>

        <section className="mb-8">
          <h3 className="text-xl font-semibold text-green-800 mb-2">¿Qué es ser proveedor en nuestra plataforma?</h3>
          <p className="text-gray-700 mb-2">
            Al convertirte en proveedor, tu empresa podrá ofrecer productos y servicios a una red de clientes interesados en soluciones de calidad. La plataforma te conecta con potenciales compradores y te permite gestionar tus propuestas, campañas y productos de manera eficiente y segura.
          </p>
          <p className="text-gray-700">
            Desde este panel podrás acceder a todas las herramientas necesarias para postular tu empresa, administrar tus campañas, publicar productos y recibir soporte personalizado.
          </p>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold text-green-800 mb-2">Beneficios para proveedores</h3>
          <ul className="list-disc pl-6 text-green-900 mb-2 space-y-1">
            <li>Acceso a una amplia base de clientes potenciales.</li>
            <li>Publica y administra tus productos y campañas en cualquier momento.</li>
            <li>Recibe solicitudes directamente de clientes interesados.</li>
            <li>Participa en campañas especiales y promociones de la plataforma.</li>
            <li>Soporte y asesoría personalizada en cada etapa.</li>
            <li>Panel de control fácil de usar y seguro.</li>
            <li>Visibilidad destacada para tus productos y servicios.</li>
            <li>Gestión ágil y transparente de tus postulaciones y ventas.</li>
            <li>Acceso a estadísticas y reportes de desempeño.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h3 className="text-xl font-semibold text-green-800 mb-2">¿Cómo ser proveedor?</h3>
          <ol className="list-decimal pl-6 text-blue-900 mb-2 space-y-1">
            <li>Envía la postulación de tu empresa desde el formulario dedicado.</li>
            <li>Completa la información necesaria sobre tu empresa y los productos o servicios que ofreces.</li>
            <li>Espera la revisión y aprobación por parte del equipo de la plataforma.</li>
            <li>Una vez aprobado, accede a todas las funcionalidades del panel y comienza a publicar.</li>
          </ol>
        </section>

        <section className="mb-8 text-center">
          <span className="block mb-2 text-lg text-blue-900 font-semibold">¿Aún no eres proveedor?</span>
          <button
            className="bg-yellow-500 hover:bg-yellow-700 text-white px-6 py-2 rounded-full font-bold shadow mb-2"
            onClick={() => navigate("/postular-empresa")}
          >
            Postula tu empresa ahora
          </button>
        </section>

        <div className="flex flex-col gap-4 mt-6">
          
          <button
            className="bg-blue-200 hover:bg-blue-300 text-blue-900 px-4 py-2 rounded font-semibold"
            onClick={() => navigate("/proveedores/mas-informacion")}
          >
            Más Información
          </button>
        </div>
      </div>
    </div>
  );
}