import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

function AdBanner() {
  const [activeAds, setActiveAds] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const now = new Date();
    const q = query(collection(db, "campanas"),
      where("fechaInicio", "<=", now),
      where("fechaFin", ">=", now)
    );
    const unsub = onSnapshot(q, snap => {
      setActiveAds(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  // Rotar banners cada 10 segundos
  useEffect(() => {
    if (activeAds.length <= 1) return;
    const interval = setInterval(() => setCurrent((c) => (c + 1) % activeAds.length), 10000);
    return () => clearInterval(interval);
  }, [activeAds]);

  if (activeAds.length === 0) return null;
  const ad = activeAds[current];

  return (
    <div className="bg-yellow-100 border border-yellow-300 p-3 mb-6 rounded flex items-center justify-between shadow">
      <a href={ad.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 w-full">
        <img src={ad.imagenURL} alt={ad.titulo} className="h-16 w-32 object-contain rounded" />
        <div>
          <h3 className="font-bold">{ad.titulo}</h3>
          <p className="text-sm">{ad.descripcion}</p>
        </div>
      </a>
    </div>
  );
}

export default AdBanner;