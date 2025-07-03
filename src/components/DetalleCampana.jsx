import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

export default function DetalleCampana({ idCampana, onVolver, onVerOtra }) {
  const [campana, setCampana] = useState(null);
  const [relacionadas, setRelacionadas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDetalle = async () => {
      setLoading(true);
      const docSnap = await getDoc(doc(db, "campañas", idCampana));
      if (docSnap.exists()) {
        setCampana({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };
    if (idCampana) cargarDetalle();
  }, [idCampana]);

  useEffect(() => {
    const buscarRelacionadas = async () => {
      if (!campana || !campana.categorias) {
        setRelacionadas([]);
        return;
      }
      const snap = await getDocs(collection(db, "campanas"));
      const rel = [];
      snap.forEach(d => {
        const data = d.data();
        if (
          d.id !== campana.id &&
          Array.isArray(data.categorias) &&
          data.categorias.some(cat => campana.categorias.includes(cat))
        ) {
          rel.push({ id: d.id, ...data });
        }
      });
      setRelacionadas(rel);
    };
    buscarRelacionadas();
  }, [campana]);

  if (loading) return <div className="text-center py-10">Cargando...</div>;
  if (!campana) return <div className="text-center py-10 text-red-600">Campaña no encontrada</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-lg mt-8">
      <button
        className="mb-4 px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-800"
        onClick={onVolver}
      >
        ← Volver
      </button>
      <div className="flex flex-col md:flex-row gap-8 mb-6">
        {campana.imagenUrl ? (
          <img
            src={campana.imagenUrl}
            alt={campana.titulo}
            className="w-64 h-64 object-contain rounded-lg shadow border"
            onError={e => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/256x256?text=Sin+imagen";
            }}
          />
        ) : (
          <div className="w-64 h-64 flex items-center justify-center bg-gray-100 text-gray-400 rounded-lg border shadow">
            Sin imagen
          </div>
        )}
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-2 text-blue-800">{campana.titulo}</h1>
          <p className="text-lg text-gray-700 mb-3">{campana.descripcion}</p>
          {Array.isArray(campana.categorias) && campana.categorias.length > 0 && (
            <div className="mb-3">
              <div className="font-semibold text-green-700 mb-1">Categorías consideradas:</div>
              <div className="flex flex-wrap gap-2">
                {campana.categorias.map((cat, idx) => (
                  <span
                    key={idx}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold shadow-sm"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <h2 className="text-xl font-bold mb-3 text-blue-700">
        Campañas relacionadas por categoría
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {relacionadas.length === 0 ? (
          <div className="text-gray-500">No hay campañas relacionadas.</div>
        ) : (
          relacionadas.map(rel => (
            <div
              key={rel.id}
              className="bg-blue-50 border rounded-lg p-4 flex gap-4 items-center cursor-pointer hover:bg-blue-100 transition"
              onClick={() => onVerOtra && onVerOtra(rel.id)}
              title="Ver detalle de esta campaña"
            >
              {rel.imagenUrl ? (
                <img
                  src={rel.imagenUrl}
                  alt={rel.titulo}
                  className="w-20 h-20 object-contain rounded border"
                  onError={e => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/80x80?text=Sin+imagen";
                  }}
                />
              ) : (
                <div className="w-20 h-20 flex items-center justify-center bg-gray-100 text-gray-400 rounded border">
                  Sin imagen
                </div>
              )}
              <div>
                <div className="font-semibold text-blue-800">{rel.titulo}</div>
                <div className="text-xs text-gray-600 truncate max-w-xs">{rel.descripcion}</div>
                {Array.isArray(rel.categorias) && rel.categorias.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {rel.categorias.map((cat, i) => (
                      <span
                        key={i}
                        className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xxs font-semibold"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}