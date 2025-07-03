import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, setDoc } from "firebase/firestore";

export default function ListadoSolicitudesProductos() {
  const [solicitudes, setSolicitudes] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "solicitudesProductos"), (snap) => {
      setSolicitudes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  async function aprobarSolicitud(s) {
    await setDoc(doc(db, "productos", s.id), {
      nombre: s.nombre,
      descripcion: s.descripcion,
      marcas: s.marcas,
      categorias: s.categorias,
      precio: Number(s.precio),
      imagenUrl: s.imagenUrl,
      urlProducto: s.urlProducto,
      idEmpresa: s.idEmpresa,
      idCampana: s.idCampana || "",
      destacado: s.destacado || false,
      creadoPor: s.creadoPor,
      fechaCreacion: s.fechaSolicitud,
      fuente: s.fuente || "manual",
      estado: "aprobado"
    });
    await updateDoc(doc(db, "solicitudesProductos", s.id), { estado: "aprobado" });
  }

  async function rechazarSolicitud(id) {
    await updateDoc(doc(db, "solicitudesProductos", id), { estado: "rechazado" });
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Solicitudes de productos pendientes</h2>
      <table className="w-full border">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Empresa</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {solicitudes.filter(s => s.estado === "pendiente").map(s => (
            <tr key={s.id}>
              <td>{s.nombre}</td>
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