import React, { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function Registro() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Usuario registrado correctamente");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleRegister} className="bg-white p-4 rounded shadow">
      <h2 className="font-bold mb-2">Registro</h2>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo" className="border p-2 mb-2 w-full" required />
      <input value={password} type="password" onChange={e => setPassword(e.target.value)} placeholder="Contraseña" className="border p-2 mb-2 w-full" required />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Registrar</button>
    </form>
  );
}