import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, setDoc } from "firebase/firestore";

export default function ListadoSolicitudesCampanas() {
  const [solicitudes, setSolicitudes] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "campanas"), (snap) => {
      setSolicitudes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  async function aprobarSolicitud(s) {
    await setDoc(doc(db, "campanas", s.id), {
      titulo: s.titulo,
      descripcion: s.descripcion,
      categorias: s.categorias,
      marcas: s.marcas,
      idEmpresa: s.idEmpresa,
      fechaInicio: s.fechaInicio,
      fechaFin: s.fechaFin,
      imagenUrl: s.imagenUrl,
      estado: "Activa",
      fechaCreacion: s.fechaSolicitud,
      creadoPor: s.creadoPor
    });
    await updateDoc(doc(db, "campanas", s.id), { estado: "Activa" });
  }

  async function rechazarSolicitud(id) {
    await updateDoc(doc(db, "campanas", id), { estado: "Rechazada" });
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Solicitudes de campañas pendientes</h2>
      <table className="w-full border">
        <thead>
          <tr>
            <th>Título</th>
            <th>Empresa</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {solicitudes.filter(s => s.estado === "pendiente").map(s => (
            <tr key={s.id}>
              <td>{s.titulo}</td>
              <td>{s.idEmpresa}</td>
              <td>{s.estado}</td>
              <td>
                <button onClick={() => aprobarSolicitud(s)} className="bg-green-500 text-white px-2 py-1 rounded mr-2">Aprobar</button>
                <button onClick={() => rechazarSolicitud(s.id)} className="bg-red-500 text-white px-2 py-1 rounded">Rechazar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}