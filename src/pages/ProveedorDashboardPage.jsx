import React, { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function fechaLegible(fecha) {
  if (!fecha) return "";
  if (fecha.toDate) return fecha.toDate().toLocaleString();
  if (fecha instanceof Date) return fecha.toLocaleString();
  if (typeof fecha === "string") return fecha;
  if (fecha.seconds) return new Date(fecha.seconds * 1000).toLocaleString();
  return "";
}

function isCerradaPorFecha(fechaFin) {
  if (!fechaFin) return false;
  let fecha = fechaFin;
  if (fecha.toDate) fecha = fecha.toDate();
  else if (fecha.seconds) fecha = new Date(fecha.seconds * 1000);
  else if (typeof fecha === "string") fecha = new Date(fecha);
  if (!(fecha instanceof Date) || isNaN(fecha.getTime())) return false;
  return fecha < new Date();
}

function ChipList({ items, color = "green" }) {
  if (!Array.isArray(items) || items.length === 0) return <span className="text-gray-400">-</span>;
  const colorClasses = {
    green: "bg-green-100 text-green-800 border-green-300",
    blue: "bg-blue-100 text-blue-800 border-blue-300",
    indigo: "bg-indigo-100 text-indigo-800 border-indigo-300",
    purple: "bg-purple-100 text-purple-800 border-purple-300",
    gray: "bg-gray-100 text-gray-700 border-gray-300",
  };
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {items.map((item, idx) => (
        <span
          key={item + idx}
          className={`px-2 py-0.5 rounded-full border text-xs font-medium ${colorClasses[color] || colorClasses.green}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export default function ProveedorDashboardPage() {
  const { user, rol } = useAuth();
  const [campanas, setCampanas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [empresa, setEmpresa] = useState(null);
  const [loadingCampanas, setLoadingCampanas] = useState(false);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [loadingEmpresa, setLoadingEmpresa] = useState(false);
  const [error, setError] = useState("");
  const [cambiando, setCambiando] = useState("");
  const navigate = useNavigate();

  // Cargar campañas y productos del proveedor
  useEffect(() => {
    if (user && rol === "proveedor") {
      setLoadingCampanas(true);
      setLoadingProductos(true);
      // Campañas
      const qCamp = query(
        collection(db, "campanas"),
        where("proveedorId", "==", user.uid)
      );
      getDocs(qCamp)
        .then(snapshot => {
          setCampanas(
            snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          );
        })
        .catch(() => setCampanas([]))
        .finally(() => setLoadingCampanas(false));
      // Productos
      const qProd = query(
        collection(db, "productos"),
        where("proveedorId", "==", user.uid)
      );
      getDocs(qProd)
        .then(snapshot => {
          setProductos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        })
        .catch(() => setProductos([]))
        .finally(() => setLoadingProductos(false));
    }
  }, [user, rol, cambiando]);

  // Cargar empresa asociada
  useEffect(() => {
    async function fetchEmpresa() {
      if (user && rol === "proveedor") {
        setLoadingEmpresa(true);
        const q = query(
          collection(db, "empresas"),
          where("email", "==", user.email)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setEmpresa({ id: snap.docs[0].id, ...snap.docs[0].data() });
        } else {
          setEmpresa(null);
        }
        setLoadingEmpresa(false);
      }
    }
    fetchEmpresa();
  }, [user, rol, cambiando]);

  // Cancelar campaña (soft delete: cambia estado a cancelada)
  async function handleCancelarCampana(id) {
    setCambiando(id);
    try {
      await updateDoc(doc(db, "campanas", id), {
        estado: "cancelada",
        fecha_cancelacion: serverTimestamp(),
      });
      setCampanas(campanas.map(c =>
        c.id === id ? { ...c, estado: "cancelada" } : c
      ));
    } catch (err) {
      setError("Error al cancelar la campaña.");
    } finally {
      setCambiando("");
    }
  }

  // Colores para estados de campaña
  function colorEstado(estado, cerradaPorVigencia = false) {
    if (cerradaPorVigencia) return "bg-gray-300 text-gray-700";
    switch ((estado || "").toLowerCase()) {
      case "enviada":
        return "bg-gray-200 text-gray-800";
      case "revision":
        return "bg-yellow-100 text-yellow-800";
      case "activo":
      case "activa":
        return "bg-green-100 text-green-800";
      case "cancelada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  function textoEstadoCampana(estado, cerradaPorVigencia = false) {
    if (cerradaPorVigencia) return "Cerrada por vigencia";
    switch ((estado || "").toLowerCase()) {
      case "enviada":
        return "Enviada";
      case "revision":
        return "En revisión";
      case "activo":
      case "activa":
        return "Activa";
      case "cancelada":
        return "Cancelada";
      default:
        return estado;
    }
  }

  // ========== RENDER ==========
  if (user && rol === "proveedor") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-green-100 py-10">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-3xl w-full">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">
            Panel del Proveedor
          </h2>
          {/* Información básica de la empresa */}
          <div className="mb-8 bg-blue-50 p-5 rounded shadow">
            <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center justify-between">
              <span>Información de mi Empresa</span>
              {empresa && (
                <button
                  className="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-800 text-white rounded text-sm"
                  onClick={() => navigate(`/proveedores/mi-empresa?edit=1`)}
                  title="Editar empresa"
                >
                  Editar
                </button>
              )}
            </h3>
            {loadingEmpresa ? (
              <div className="text-gray-500 text-sm">Cargando información de la empresa...</div>
            ) : empresa ? (
              <div className="space-y-1">
                <div>
                  <span className="font-semibold text-blue-900">Nombre:</span>{" "}
                  <span className="text-gray-900">{empresa.nombre}</span>
                </div>
                <div>
                  <span className="font-semibold text-blue-900">RUT:</span>{" "}
                  <span className="text-gray-900">{empresa.rut}</span>
                </div>
                <div>
                  <span className="font-semibold text-blue-900">Correo:</span>{" "}
                  <span className="text-gray-900">{empresa.email}</span>
                </div>
                <div>
                  <span className="font-semibold text-blue-900">Teléfono:</span>{" "}
                  <span className="text-gray-900">{empresa.telefono}</span>
                </div>
                <div>
                  <span className="font-semibold text-blue-900">Dirección:</span>{" "}
                  <span className="text-gray-900">
                    {empresa.direccion}, {empresa.ciudad}, {empresa.region}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-blue-900">Web:</span>{" "}
                  {empresa.web ? (
                    <a
                      href={empresa.web}
                      className="text-blue-700 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {empresa.web}
                    </a>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </div>
                <div>
                  <span className="font-semibold text-blue-900">Estado:</span>{" "}
                  <span className="text-gray-900">{empresa.estado || "-"}</span>
                </div>
                <div>
                  <span className="font-semibold text-blue-900">Categorías:</span>
                  <ChipList items={empresa.categorias} color="green" />
                </div>
                <div>
                  <span className="font-semibold text-blue-900">Marcas:</span>
                  <ChipList items={empresa.marcas} color="indigo" />
                </div>
              </div>
            ) : (
              <div className="text-yellow-700">
                No tienes empresa asociada.{" "}
                <button
                  className="underline"
                  onClick={() => navigate("/postular-empresa")}
                >
                  Postula tu empresa aquí.
                </button>
              </div>
            )}
          </div>
          {/* Botones de acción */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <button
              className="bg-blue-600 hover:bg-blue-800 text-white px-4 py-2 rounded font-semibold"
              onClick={() => navigate("/proveedores/solicitar-campana")}
            >
              Ingresar Solicitud de Campaña
            </button>
            <button
              className="bg-indigo-600 hover:bg-indigo-800 text-white px-4 py-2 rounded font-semibold"
              onClick={() => navigate("/proveedores/solicitar-producto")}
            >
              Ingresar Solicitud de Producto
            </button>
            {!empresa && (
              <button
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded font-semibold"
                onClick={() => navigate("/postular-empresa")}
              >
                Enviar Solicitud de Empresa
              </button>
            )}
            <button
              className="bg-gray-200 hover:bg-gray-300 text-blue-900 px-4 py-2 rounded font-semibold"
              onClick={() => navigate("/proveedores/mas-informacion")}
            >
              Más Información
            </button>
          </div>
          {/* Campañas */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10l1.664 1.664A9 9 0 0021 12V9a9 9 0 00-18 0v1z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 21h6" />
              </svg>
              <h3 className="text-xl font-bold text-blue-800">Mis Campañas</h3>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-100">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 uppercase">Título</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 uppercase">Estado</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 uppercase">Vigencia</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {loadingCampanas ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4">Cargando campañas...</td>
                    </tr>
                  ) : campanas.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-gray-500 text-center py-4">No tienes campañas registradas.</td>
                    </tr>
                  ) : (
                    campanas.map(c => {
                      const cerradaPorVigencia = isCerradaPorFecha(c.fechaFin) && c.estado !== "cancelada";
                      return (
                        <tr key={c.id} className={cerradaPorVigencia ? "opacity-70" : ""}>
                          <td className="py-2 px-3 align-top">
                            <span className="font-medium text-base">{c.titulo || c.nombre || "(Sin título)"}</span>
                            {c.descripcion && (
                              <div className="text-gray-700 text-xs mt-1">{c.descripcion}</div>
                            )}
                            {Array.isArray(c.categorias) && c.categorias.length > 0 && (
                              <div>
                                <span className="font-semibold text-xs text-blue-800">Categorías:</span>
                                <ChipList items={c.categorias} color="green" />
                              </div>
                            )}
                            {Array.isArray(c.marcas) && c.marcas.length > 0 && (
                              <div>
                                <span className="font-semibold text-xs text-blue-800">Marcas:</span>
                                <ChipList items={c.marcas} color="indigo" />
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 align-top">
                            <span className={`text-xs px-2 py-1 rounded font-bold whitespace-nowrap ${colorEstado(c.estado, cerradaPorVigencia)}`}>
                              {textoEstadoCampana(c.estado, cerradaPorVigencia)}
                            </span>
                          </td>
                          <td className="py-2 px-3 align-top whitespace-nowrap">
                            <span className="text-xs text-gray-700">
                              {fechaLegible(c.fechaInicio)}
                              {c.fechaFin ? " - " + fechaLegible(c.fechaFin) : ""}
                            </span>
                          </td>
                          <td className="py-2 px-3 align-top">
                            {c.estado === "enviada" && !cerradaPorVigencia && (
                              <button
                                className="text-xs px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200"
                                disabled={cambiando === c.id}
                                onClick={() => handleCancelarCampana(c.id)}
                              >
                                Cancelar campaña
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Productos */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 16.5V8a2 2 0 00-2-2H7a2 2 0 00-2 2v8.5" />
              </svg>
              <h3 className="text-xl font-bold text-purple-800">Mis Productos</h3>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-purple-100">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-bold text-purple-700 uppercase">Nombre</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-purple-700 uppercase">Estado</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-purple-700 uppercase">Precio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                  {loadingProductos ? (
                    <tr>
                      <td colSpan={3} className="text-center py-4">Cargando productos...</td>
                    </tr>
                  ) : productos.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-gray-500 text-center py-4">No tienes productos registrados.</td>
                    </tr>
                  ) : (
                    productos.map(p => (
                      <tr key={p.id}>
                        <td className="py-2 px-3 align-top">
                          <span className="font-medium text-base">{p.nombre || p.titulo || "(Sin nombre)"}</span>
                          {p.descripcion && (
                            <div className="text-gray-700 text-xs mt-1">{p.descripcion}</div>
                          )}
                          {Array.isArray(p.categorias) && p.categorias.length > 0 && (
                            <div>
                              <span className="font-semibold text-xs text-blue-800">Categorías:</span>
                              <ChipList items={p.categorias} color="green" />
                            </div>
                          )}
                          {Array.isArray(p.marcas) && p.marcas.length > 0 && (
                            <div>
                              <span className="font-semibold text-xs text-blue-800">Marcas:</span>
                              <ChipList items={p.marcas} color="indigo" />
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 align-top">
                          <span className={`text-xs px-2 py-1 rounded font-bold whitespace-nowrap ${colorEstado(p.estado)}`}>
                            {p.estado === "enviada"
                              ? "Enviada"
                              : p.estado === "revision"
                              ? "En revisión"
                              : p.estado === "activa" || p.estado === "activo"
                              ? "Activa"
                              : p.estado === "cancelada"
                              ? "Cancelado"
                              : p.estado || ""}
                          </span>
                        </td>
                        <td className="py-2 px-3 align-top whitespace-nowrap">
                          {p.precio !== undefined && (
                            <span className="text-xs text-gray-800">
                              ${p.precio}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si no es proveedor, renderiza otra cosa...
  return (
    <div className="min-h-screen flex items-center justify-center text-center">
      <div className="bg-white p-8 rounded shadow max-w-lg">
        <p>No tienes acceso a esta sección.</p>
      </div>
    </div>
  );
}