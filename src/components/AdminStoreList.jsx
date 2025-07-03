import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";
import EmpresaMap from "./EmpresaMap";

function AdminStoreList() {
  const [empresas, setEmpresas] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "empresas"), snapshot => {
      setEmpresas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  const startEdit = (emp) => {
    setEditId(emp.id);
    setEditData(emp);
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleLocationChange = ({ lat, lng }) => {
    setEditData({ ...editData, lat, lng });
  };

  const saveEdit = async () => {
    const {id, ...rest} = editData;
    await updateDoc(doc(db, "empresas", editId), rest);
    setEditId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar esta empresa?")) {
      await deleteDoc(doc(db, "empresas", id));
    }
  };

  return (
    <section id="admin-empresas" className="p-4">
      <h2 className="mb-2 font-semibold text-lg">Administrar Empresas</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {empresas.map(emp => (
          <div key={emp.id} className="bg-white rounded shadow p-4 flex flex-col">
            {editId === emp.id ? (
              <>
                <input className="border p-1 mb-1 w-full" name="nombre" value={editData.nombre || ""} onChange={handleEditChange} />
                <input className="border p-1 mb-1 w-full" name="direccion" value={editData.direccion || ""} onChange={handleEditChange} />
                <input className="border p-1 mb-1 w-full" name="categoria" value={editData.categoria || ""} onChange={handleEditChange} />
                <input className="border p-1 mb-1 w-full" name="telefono" value={editData.telefono || ""} onChange={handleEditChange} />
                <input className="border p-1 mb-1 w-full" name="whatsapp" value={editData.whatsapp || ""} onChange={handleEditChange} />
                <input className="border p-1 mb-1 w-full" name="web" value={editData.web || ""} onChange={handleEditChange} />
                <input className="border p-1 mb-1 w-full" name="calificacion" value={editData.calificacion || ""} onChange={handleEditChange} />
                <EmpresaMap lat={editData.lat} lng={editData.lng} onLocationChange={handleLocationChange} />
                <div className="mt-2 flex gap-2">
                  <button className="bg-green-600 text-white px-2 py-1 rounded" onClick={saveEdit}>Guardar</button>
                  <button className="bg-gray-400 text-white px-2 py-1 rounded" onClick={() => setEditId(null)}>Cancelar</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <h3 className="font-bold">{emp.nombre}</h3>
                  <p className="text-sm text-gray-600">{emp.direccion}</p>
                  <p className="text-xs text-gray-500">{emp.categoria}</p>
                  <p className="text-xs">Tel: {emp.telefono}</p>
                  {emp.lat && emp.lng && <EmpresaMap lat={emp.lat} lng={emp.lng} />}
                </div>
                <div className="flex gap-2 mt-2">
                  <button className="bg-blue-500 text-white px-2 py-1 rounded" onClick={() => startEdit(emp)}>Editar</button>
                  <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => handleDelete(emp.id)}>Eliminar</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default AdminStoreList;