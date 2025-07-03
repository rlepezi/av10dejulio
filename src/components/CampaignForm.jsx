import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

function CampaignForm() {
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    imagenURL: "",
    link: "",
    fechaInicio: "",
    fechaFin: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo || !form.imagenURL || !form.fechaInicio || !form.fechaFin) {
      alert("Completa los campos obligatorios.");
      return;
    }
    await addDoc(collection(db, "campanas"), {
      ...form,
      fechaInicio: new Date(form.fechaInicio),
      fechaFin: new Date(form.fechaFin),
    });
    setForm({ titulo: "", descripcion: "", imagenURL: "", link: "", fechaInicio: "", fechaFin: "" });
    alert("¡Campaña creada!");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow max-w-md mx-auto mb-8">
      <h2 className="font-semibold mb-2">Crear nueva campaña</h2>
      <input className="border p-2 mb-2 w-full" name="titulo" value={form.titulo} onChange={handleChange} placeholder="Título" required />
      <input className="border p-2 mb-2 w-full" name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Descripción" />
      <input className="border p-2 mb-2 w-full" name="imagenURL" value={form.imagenURL} onChange={handleChange} placeholder="URL de imagen" required />
      <input className="border p-2 mb-2 w-full" name="link" value={form.link} onChange={handleChange} placeholder="Enlace de destino" />
      <label className="block text-sm mb-1">Fecha inicio:</label>
      <input className="border p-2 mb-2 w-full" type="datetime-local" name="fechaInicio" value={form.fechaInicio} onChange={handleChange} required />
      <label className="block text-sm mb-1">Fecha fin:</label>
      <input className="border p-2 mb-2 w-full" type="datetime-local" name="fechaFin" value={form.fechaFin} onChange={handleChange} required />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-2">Guardar campaña</button>
    </form>
  );
}
export default CampaignForm;