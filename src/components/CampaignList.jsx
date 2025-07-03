import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";

function CampaignList() {
  const [campañas, setCampañas] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "campanas"), snapshot => {
      setCampañas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  const startEdit = (c) => {
    setEditId(c.id);
    setEditForm({
      ...c,
      fechaInicio: c.fechaInicio?.toDate ? c.fechaInicio.toDate().toISOString().slice(0,16) : c.fechaInicio,
      fechaFin: c.fechaFin?.toDate ? c.fechaFin.toDate().toISOString().slice(0,16) : c.fechaFin,
    });
  };

  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    const {id, ...rest} = editForm;
    await updateDoc(doc(db, "campanas", editId), {
      ...rest,
      fechaInicio: new Date(editForm.fechaInicio),
      fechaFin: new Date(editForm.fechaFin)
    });
    setEditId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar campaña?")) {
      await deleteDoc(doc(db, "campanas", id));
    }
  };

  return (
    <div className="mt-6">
      <h2 className="font-semibold mb-2">Campañas activas</h2>
      {campañas.map(c => (
        <div key={c.id} className="bg-white rounded shadow p-4 mb-2 flex flex-col md:flex-row justify-between">
          {editId === c.id ? (
            <div className="flex-1">
              <input className="border p-1 mb-1 w-full" name="titulo" value={editForm.titulo} onChange={handleChange} />
              <input className="border p-1 mb-1 w-full" name="descripcion" value={editForm.descripcion} onChange={handleChange} />
              <input className="border p-1 mb-1 w-full" name="imagenURL" value={editForm.imagenURL} onChange={handleChange} />
              <input className="border p-1 mb-1 w-full" name="link" value={editForm.link} onChange={handleChange} />
              <input className="border p-1 mb-1 w-full" type="datetime-local" name="fechaInicio" value={editForm.fechaInicio} onChange={handleChange} />
              <input className="border p-1 mb-1 w-full" type="datetime-local" name="fechaFin" value={editForm.fechaFin} onChange={handleChange} />
              <div>
                <button className="bg-green-600 text-white px-2 py-1 rounded mr-2" onClick={saveEdit}>Guardar</button>
                <button className="bg-gray-400 text-white px-2 py-1 rounded" onClick={() => setEditId(null)}>Cancelar</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1">
                <strong>{c.titulo}</strong> — {c.descripcion} <br />
                <a href={c.link} className="text-blue-500" target="_blank" rel="noopener noreferrer">{c.link}</a>
                <div className="text-xs text-gray-500">
                  {c.fechaInicio && new Date(c.fechaInicio.seconds ? c.fechaInicio.seconds * 1000 : c.fechaInicio).toLocaleString()} - 
                  {c.fechaFin && new Date(c.fechaFin.seconds ? c.fechaFin.seconds * 1000 : c.fechaFin).toLocaleString()}
                </div>
              </div>
              <div className="flex flex-col items-end mt-2 md:mt-0">
                <button className="bg-blue-500 text-white px-2 py-1 rounded mb-1" onClick={() => startEdit(c)}>Editar</button>
                <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => handleDelete(c.id)}>Eliminar</button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
export default CampaignList;