import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import CampaignCard from "./CampaignCard";

export default function ListadoCampanas({ filtroMarca, filtroBusqueda, onVerDetalle }) {
  const [campanas, setCampanas] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "campanas"), (snapshot) => {
      setCampanas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  function estaVigente(fechaFin) {
    if (!fechaFin) return false;
    let fin;
    if (typeof fechaFin === "object" && fechaFin.seconds) {
      fin = new Date(fechaFin.seconds * 1000);
    } else {
      fin = new Date(fechaFin);
    }
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    fin.setHours(0,0,0,0);
    return fin >= hoy;
  }

  let campanasFiltradas = campanas.filter(
    camp => camp.fechaFin && estaVigente(camp.fechaFin) && camp.estado === "Activa"
  );

  if (filtroMarca) {
    campanasFiltradas = campanasFiltradas.filter(camp =>
      Array.isArray(camp.marcas) &&
      camp.marcas.some(m => m.trim().toLowerCase() === filtroMarca.trim().toLowerCase())
    );
  }

  if (filtroBusqueda && filtroBusqueda.trim() !== "") {
    const q = filtroBusqueda.trim().toLowerCase();
    campanasFiltradas = campanasFiltradas.filter(camp =>
      (camp.titulo && camp.titulo.toLowerCase().includes(q)) ||
      (camp.descripcion && camp.descripcion.toLowerCase().includes(q)) ||
      (Array.isArray(camp.marcas) && camp.marcas.some(m => m.toLowerCase().includes(q))) ||
      (Array.isArray(camp.categorias) && camp.categorias.some(cat => cat.toLowerCase().includes(q)))
    );
  }

  const handleViewDetail = (campaignId) => {
    if (onVerDetalle) {
      onVerDetalle(campaignId);
    }
  };

  if (campanasFiltradas.length === 0) {
    return (
      <div className="text-gray-500 text-sm px-4 mt-8">No hay campañas disponibles.</div>
    );
  }

  return (
    <div className="mt-8 px-4 w-full">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {campanasFiltradas.map(campaign => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            onViewDetail={handleViewDetail}
          />
        ))}
      </div>
    </div>
  );
}