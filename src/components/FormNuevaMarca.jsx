import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

export default function FormNuevaMarca() {
  const [nombre, setNombre] = useState("");
  const [logoURL, setLogoURL] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "marcas"), { nombre, logoURL });
    setNombre("");
    setLogoURL("");
    alert("Marca guardada");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4">
      <h2 className="font-bold mb-2">Nueva Marca</h2>
      <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre" className="border p-2 mb-2 w-full" required />
      <input value={logoURL} onChange={e => setLogoURL(e.target.value)} placeholder="URL logo" className="border p-2 mb-2 w-full" />
      <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded">Guardar</button>
    </form>
  );
}