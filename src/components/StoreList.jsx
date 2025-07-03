import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import StoreFilters from "./StoreFilters";

function StoreList() {
  const [filters, setFilters] = useState({nombre: "", categoria: ""});
  const [empresas, setEmpresas] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "empresas"), snapshot => {
      setEmpresas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  const empresasFiltradas = empresas.filter(emp => 
    emp.nombre.toLowerCase().includes(filters.nombre.toLowerCase()) &&
    (filters.categoria === "" || emp.categoria === filters.categoria)
  );

  return (
    <section id="empresas" className="p-4">
      <StoreFilters filters={filters} setFilters={setFilters} />
      <div className="grid md:grid-cols-2 gap-4">
        {empresasFiltradas.map(emp => (
          <div key={emp.id} className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-center">
            <div className="flex-1">
              <h3 className="font-bold">{emp.nombre}</h3>
              <p className="text-sm text-gray-600">{emp.direccion}</p>
              <p className="text-xs text-gray-500">{emp.categoria}</p>
              <p className="text-xs">Tel: {emp.telefono}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
export default StoreList;