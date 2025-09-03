import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, updateDoc, doc, deleteDoc, setDoc } from "firebase/firestore";

export default function ListadoSolicitudesEmpresas() {
  const [solicitudes, setSolicitudes] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "solicitudesEmpresas"), (snap) => {
      setSolicitudes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  async function aprobarSolicitud(solicitud) {
    // 1. Crear usuario proveedor
    // 2. Crear empresa
    // 3. Actualizar solicitud a 'aceptada'
    const proveedorUid = crypto.randomUUID(); // Ideal: usar auth.createUserWithEmailAndPassword (ver nota)
    await setDoc(doc(db, "usuarios", proveedorUid), {
      nombre: solicitud.encargado.nombre,
      email: solicitud.encargado.email,
      telefono: solicitud.encargado.telefono,
              rol: "proveedor",
      empresaId: solicitud.id
    });
    await setDoc(doc(db, "empresas", solicitud.id), {
      nombre: solicitud.nombre,
      direccion: solicitud.direccion,
      web: solicitud.web,
      telefono: solicitud.telefono,
      email: solicitud.email,
      categorias: solicitud.categorias,
      marcas: solicitud.marcas,
      idEncargado: proveedorUid,
      proveedorEspecial: false,
      estado: "Activa"
    });
    await updateDoc(doc(db, "solicitudesEmpresas", solicitud.id), { estado: "Activa" });
  }

  async function rechazarSolicitud(id) {
    await updateDoc(doc(db, "solicitudesEmpresas", id), { estado: "Rechazada" });
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Solicitudes de empresas pendientes</h2>
      <table className="w-full border">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Encargado</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {solicitudes.filter(s => s.estado === "pendiente").map(s => (
            <tr key={s.id}>
              <td>{s.nombre}</td>
              <td>{s.encargado?.nombre} ({s.encargado?.email})</td>
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