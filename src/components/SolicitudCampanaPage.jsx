import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, Timestamp, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { useAuth } from "./AuthProvider";

export default function SolicitudCampanaPage() {
  const { user } = useAuth();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [imagenURL, setImagenURL] = useState("");
  const [link, setLink] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [idEmpresa, setIdEmpresa] = useState("");
  const [empresa, setEmpresa] = useState(null);
  const navigate = useNavigate();

  // Cargar la empresa asociada al usuario
  useEffect(() => {
    async function fetchEmpresa() {
      if (user) {
        const q = query(
          collection(db, "empresas"),
          where("email", "==", user.email)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setIdEmpresa(snap.docs[0].id);
          setEmpresa(snap.docs[0].data());
        }
      }
    }
    fetchEmpresa();
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    setError("");

    if (!titulo || !descripcion || !fechaInicio || !fechaFin || !idEmpresa || !empresa) {
      setError("Debes completar todos los campos principales, incluyendo empresa.");
      setGuardando(false);
      return;
    }
    if (!user) {
      setError("No hay usuario autenticado.");
      setGuardando(false);
      return;
    }

    try {
      await addDoc(collection(db, "campanas"), {
        titulo,
        descripcion,
        fechaInicio: Timestamp.fromDate(new Date(fechaInicio)),
        fechaFin: Timestamp.fromDate(new Date(fechaFin)),
        proveedorId: user.uid,
        idEmpresa,
        categorias: empresa.categorias || [],
        marcas: empresa.marcas || [],
        imagenURL,
        link,
        estado: "Enviada", // Primer estado
        fecha_creacion: serverTimestamp()
      });
      navigate("/proveedores");
    } catch (err) {
      setError("Error al guardar la campaña. Intenta nuevamente.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-green-100 py-10">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow max-w-md w-full"
      >
        <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">
          Solicitud de Nueva Campaña
        </h2>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <label className="block mb-2 font-semibold">Título de la campaña</label>
        <input
          className="mb-4 w-full border p-2 rounded"
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          required
        />
        <label className="block mb-2 font-semibold">Descripción</label>
        <textarea
          className="mb-4 w-full border p-2 rounded"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          required
        />
        <label className="block mb-2 font-semibold">Fecha de inicio</label>
        <input
          type="datetime-local"
          className="mb-4 w-full border p-2 rounded"
          value={fechaInicio}
          onChange={e => setFechaInicio(e.target.value)}
          required
        />
        <label className="block mb-2 font-semibold">Fecha de término</label>
        <input
          type="datetime-local"
          className="mb-4 w-full border p-2 rounded"
          value={fechaFin}
          onChange={e => setFechaFin(e.target.value)}
          required
        />

        <label className="block mb-2 font-semibold">Imagen (URL)</label>
        <input
          className="mb-4 w-full border p-2 rounded"
          value={imagenURL}
          onChange={e => setImagenURL(e.target.value)}
          placeholder="https://..."
        />

        <label className="block mb-2 font-semibold">Link (opcional)</label>
        <input
          className="mb-4 w-full border p-2 rounded"
          value={link}
          onChange={e => setLink(e.target.value)}
          placeholder="https://..."
        />

        {/* Mostrar marcas y categorías de la empresa asociada */}
        <div className="mb-4">
          <label className="font-semibold block mb-1">Categorías asociadas a tu empresa:</label>
          {empresa?.categorias?.length ? (
            <div className="flex flex-wrap gap-2">
              {empresa.categorias.map((cat) => (
                <span key={cat} className="bg-gray-100 px-2 py-1 rounded text-sm">{cat}</span>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Sin categorías</div>
          )}
        </div>
        <div className="mb-4">
          <label className="font-semibold block mb-1">Marcas asociadas a tu empresa:</label>
          {empresa?.marcas?.length ? (
            <div className="flex flex-wrap gap-2">
              {empresa.marcas.map((m) => (
                <span key={m} className="bg-gray-100 px-2 py-1 rounded text-sm">{m}</span>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Sin marcas</div>
          )}
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="bg-blue-700 hover:bg-blue-900 text-white w-full py-2 rounded font-semibold"
        >
          {guardando ? "Guardando..." : "Guardar Campaña"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/proveedores")}
          className="w-full mt-3 text-blue-700 underline"
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}