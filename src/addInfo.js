import { db } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

// Ejemplo para agregar una empresa
async function crearEmpresaEjemplo() {
  await addDoc(collection(db, "empresas"), {
    nombre: "Ferretería El Tornillo",
    direccion: "Av. 10 de Julio #123",
    telefono: "+56 9 1234 5678",
    rubro: "Ferretería",
    descripcion: "Todo en herramientas y materiales.",
    logoURL: "https://via.placeholder.com/150",
    destacado: true,
    // Puedes agregar más campos
  });
}

// Ejemplo para una campaña/banner
async function crearCampañaEjemplo() {
  await addDoc(collection(db, "campañas"), {
    titulo: "Promo Herramientas",
    descripcion: "¡20% de descuento en herramientas!",
    imagenURL: "https://via.placeholder.com/300x100",
    link: "https://www.miferreteria.cl/promos",
    fechaInicio: Timestamp.fromDate(new Date()),
    fechaFin: Timestamp.fromDate(new Date("2025-12-31")),
  });
}