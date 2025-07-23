import { db } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

// Empresas de ejemplo para testing
const empresasEjemplo = [
  {
    nombre: "Ferretería El Tornillo",
    direccion: "Av. 10 de Julio #123, Santiago",
    telefono: "+56 9 1234 5678",
    email: "contacto@eltornillo.cl",
    categoria: "Ferretería",
    rubro: "Ferretería",
    descripcion: "Todo en herramientas y materiales para la construcción.",
    descripcionCompleta: "Somos una ferretería familiar con más de 20 años de experiencia en el rubro. Ofrecemos una amplia gama de herramientas, materiales de construcción y artículos para el hogar. Nuestro compromiso es brindar productos de calidad y un servicio personalizado a cada cliente.",
    web: "",
    logo: "Ferreteria_ElTornillo.png",
    imagenLocal: "ferreteria_local.jpg",
    logoAsignado: true,
    estado: "activa",
    fechaRegistro: new Date(),
    destacado: true,
    servicios: ["Venta de herramientas", "Materiales de construcción", "Asesoría técnica", "Delivery"],
    horarios: {
      lunes: { activo: true, inicio: "08:00", fin: "18:00" },
      martes: { activo: true, inicio: "08:00", fin: "18:00" },
      miercoles: { activo: true, inicio: "08:00", fin: "18:00" },
      jueves: { activo: true, inicio: "08:00", fin: "18:00" },
      viernes: { activo: true, inicio: "08:00", fin: "18:00" },
      sabado: { activo: true, inicio: "09:00", fin: "14:00" },
      domingo: { activo: false }
    },
    contactoAdicional: {
      whatsapp: "+56 9 1234 5678",
      facebook: "FerreteriaElTornillo",
      instagram: "ferreteria_eltornillo"
    },
    galeria: ["herramientas1.jpg", "local_ferreteria.jpg", "materiales.jpg"]
  },
  {
    nombre: "Automotora Los Andes",
    direccion: "Calle Principal #456, Las Condes",
    telefono: "+56 9 2345 6789",
    email: "ventas@losandes.cl",
    categoria: "Automotora",
    rubro: "Automotora",
    descripcion: "Venta de vehículos nuevos y usados con garantía.",
    descripcionCompleta: "Automotora con más de 15 años en el mercado, especializada en la venta de vehículos nuevos y usados. Ofrecemos las mejores marcas del mercado con garantía extendida y planes de financiamiento flexibles. Nuestro equipo de profesionales está capacitado para asesorarte en la compra de tu próximo vehículo.",
    web: "https://www.losandes.cl",
    logo: "Automotora_LosAndes.png",
    imagenLocal: "automotora_showroom.jpg",
    logoAsignado: true,
    estado: "activa",
    fechaRegistro: new Date(),
    destacado: false,
    servicios: ["Venta de autos nuevos", "Venta de autos usados", "Financiamiento", "Garantía extendida", "Test drive"],
    horarios: {
      lunes: { activo: true, inicio: "09:00", fin: "19:00" },
      martes: { activo: true, inicio: "09:00", fin: "19:00" },
      miercoles: { activo: true, inicio: "09:00", fin: "19:00" },
      jueves: { activo: true, inicio: "09:00", fin: "19:00" },
      viernes: { activo: true, inicio: "09:00", fin: "19:00" },
      sabado: { activo: true, inicio: "10:00", fin: "16:00" },
      domingo: { activo: true, inicio: "10:00", fin: "14:00" }
    },
    contactoAdicional: {
      whatsapp: "+56 9 2345 6789",
      facebook: "AutomotraLosAndes",
      instagram: "losandes_autos"
    },
    galeria: ["showroom1.jpg", "autos_nuevos.jpg", "equipo_ventas.jpg"]
  },
  {
    nombre: "Repuestos Chile Central",
    direccion: "Av. Libertador #789, Santiago Centro",
    telefono: "+56 9 3456 7890",
    email: "info@chilecentral.cl",
    categoria: "Repuestos",
    rubro: "Repuestos",
    descripcion: "Repuestos originales y alternativos para todo tipo de vehículos.",
    descripcionCompleta: "Especialistas en repuestos automotrices con más de 25 años de experiencia. Contamos con un amplio stock de repuestos originales y alternativos para todas las marcas y modelos. Ofrecemos asesoría técnica especializada y garantía en todos nuestros productos.",
    web: "",
    logo: "",
    imagenLocal: "repuestos_bodega.jpg",
    logoAsignado: false,
    estado: "inactiva",
    fechaRegistro: new Date(),
    destacado: false,
    servicios: ["Repuestos originales", "Repuestos alternativos", "Asesoría técnica", "Instalación", "Garantía"],
    horarios: {
      lunes: { activo: true, inicio: "08:30", fin: "17:30" },
      martes: { activo: true, inicio: "08:30", fin: "17:30" },
      miercoles: { activo: true, inicio: "08:30", fin: "17:30" },
      jueves: { activo: true, inicio: "08:30", fin: "17:30" },
      viernes: { activo: true, inicio: "08:30", fin: "17:30" },
      sabado: { activo: true, inicio: "09:00", fin: "13:00" },
      domingo: { activo: false }
    },
    galeria: ["repuestos_motor.jpg", "filtros.jpg", "bodega_repuestos.jpg"]
  },
  {
    nombre: "Taller Mecánico Express",
    direccion: "Calle Reparaciones #321, Ñuñoa",
    telefono: "+56 9 4567 8901",
    email: "contacto@express.cl",
    categoria: "Taller",
    rubro: "Mecánica",
    descripcion: "Reparaciones rápidas y garantizadas para tu vehículo.",
    descripcionCompleta: "Taller mecánico especializado en reparaciones rápidas y mantenciones preventivas. Contamos con tecnología de punta y mecánicos certificados. Ofrecemos diagnóstico computarizado, cambio de aceite express, reparaciones de motor, frenos y transmisión con garantía de 6 meses.",
    web: "https://www.express.cl",
    logo: "Taller_Express.png",
    imagenLocal: "taller_bahias.jpg",
    logoAsignado: true,
    estado: "suspendida",
    fechaRegistro: new Date(),
    destacado: false,
    servicios: ["Mantención preventiva", "Reparación de motores", "Sistema de frenos", "Transmisión", "Diagnóstico computarizado"],
    horarios: {
      lunes: { activo: true, inicio: "08:00", fin: "18:00" },
      martes: { activo: true, inicio: "08:00", fin: "18:00" },
      miercoles: { activo: true, inicio: "08:00", fin: "18:00" },
      jueves: { activo: true, inicio: "08:00", fin: "18:00" },
      viernes: { activo: true, inicio: "08:00", fin: "18:00" },
      sabado: { activo: true, inicio: "08:00", fin: "12:00" },
      domingo: { activo: false }
    },
    contactoAdicional: {
      whatsapp: "+56 9 4567 8901"
    },
    galeria: ["taller_equipos.jpg", "mecanicos.jpg", "bahia_trabajo.jpg"]
  },
  {
    nombre: "Lubricantes del Norte",
    direccion: "Av. Industrial #654, Quilicura",
    telefono: "+56 9 5678 9012",
    email: "ventas@lubrinorte.cl",
    categoria: "Lubricantes",
    rubro: "Lubricantes",
    descripcion: "Aceites y lubricantes profesionales para todo tipo de motores.",
    descripcionCompleta: "Empresa especializada en la distribución de aceites y lubricantes de las mejores marcas internacionales. Atendemos tanto a talleres como a usuarios finales. Contamos con asesoría técnica especializada para la selección del lubricante adecuado según las especificaciones de cada motor.",
    web: "",
    logo: "",
    imagenLocal: "bodega_lubricantes.jpg",
    logoAsignado: false,
    estado: "activa",
    fechaRegistro: new Date(),
    destacado: true,
    servicios: ["Aceites para motor", "Lubricantes industriales", "Filtros", "Asesoría técnica", "Delivery"],
    horarios: {
      lunes: { activo: true, inicio: "07:30", fin: "17:00" },
      martes: { activo: true, inicio: "07:30", fin: "17:00" },
      miercoles: { activo: true, inicio: "07:30", fin: "17:00" },
      jueves: { activo: true, inicio: "07:30", fin: "17:00" },
      viernes: { activo: true, inicio: "07:30", fin: "17:00" },
      sabado: { activo: false },
      domingo: { activo: false }
    },
    contactoAdicional: {
      whatsapp: "+56 9 5678 9012",
      instagram: "lubricantes_norte"
    },
    galeria: ["aceites_motor.jpg", "bodega_productos.jpg", "equipo_ventas.jpg"]
  }
];

// Función para crear una empresa específica
async function crearEmpresaEjemplo() {
  await addDoc(collection(db, "empresas"), empresasEjemplo[0]);
  console.log("✅ Empresa de ejemplo creada");
}

// Función para crear todas las empresas de ejemplo
async function crearTodasLasEmpresas() {
  console.log("🏗️ Creando empresas de ejemplo...");
  
  for (let i = 0; i < empresasEjemplo.length; i++) {
    try {
      const docRef = await addDoc(collection(db, "empresas"), empresasEjemplo[i]);
      console.log(`✅ Empresa ${i + 1}/5 creada:`, empresasEjemplo[i].nombre, "ID:", docRef.id);
    } catch (error) {
      console.error(`❌ Error creando empresa ${i + 1}:`, error);
    }
  }
  
  console.log("🎉 Proceso completado");
}

// Función para crear solicitudes de ejemplo
async function crearSolicitudesEjemplo() {
  console.log("📋 Creando solicitudes de ejemplo...");
  
  const solicitudesEjemplo = [
    {
      nombre_empresa: "Taller Auto Servicio",
      email_empresa: "contacto@autoservicio.cl",
      telefono_empresa: "+56 9 8765 4321",
      direccion_empresa: "Av. Reparaciones #999, Maipú",
      categoria: "Taller",
      representante_nombre: "Carlos Méndez",
      representante_email: "carlos@autoservicio.cl",
      representante_telefono: "+56 9 8765 4321",
      descripcion: "Taller especializado en mantención y reparación de vehículos",
      estado: "pendiente",
      fecha_solicitud: new Date(),
      origen: "formulario_web"
    },
    {
      nombre_empresa: "Repuestos Motor Chile",
      email_empresa: "ventas@motorchile.cl",
      telefono_empresa: "+56 9 5555 1234",
      direccion_empresa: "Calle Mecánica #456, Santiago",
      categoria: "Repuestos",
      representante_nombre: "Ana Torres",
      representante_email: "ana@motorchile.cl",
      representante_telefono: "+56 9 5555 1234",
      descripcion: "Distribuidora de repuestos para todo tipo de vehículos",
      estado: "en_revision",
      fecha_solicitud: new Date(Date.now() - 86400000), // 1 día atrás
      origen: "agente_campo"
    },
    {
      nombre_empresa: "Lubricantes Express",
      email_empresa: "info@lubexpress.cl",
      telefono_empresa: "+56 9 7777 8888",
      direccion_empresa: "Av. Industrial #888, Quilicura",
      categoria: "Lubricantes",
      representante_nombre: "Roberto Silva",
      representante_email: "roberto@lubexpress.cl",
      representante_telefono: "+56 9 7777 8888",
      descripcion: "Venta de aceites y lubricantes para vehículos e industria",
      estado: "pendiente",
      fecha_solicitud: new Date(Date.now() - 172800000), // 2 días atrás
      origen: "formulario_web"
    }
  ];

  for (let i = 0; i < solicitudesEjemplo.length; i++) {
    try {
      const docRef = await addDoc(collection(db, "solicitudes_empresa"), solicitudesEjemplo[i]);
      console.log(`✅ Solicitud ${i + 1}/3 creada:`, solicitudesEjemplo[i].nombre_empresa, "ID:", docRef.id);
    } catch (error) {
      console.error(`❌ Error creando solicitud ${i + 1}:`, error);
    }
  }
  
  console.log("🎉 Solicitudes de ejemplo creadas");
}

// Función para crear solicitudes de clientes de ejemplo
async function crearSolicitudesClientesEjemplo() {
  console.log("👥 Creando solicitudes de clientes de ejemplo...");
  
  const solicitudesClientes = [
    {
      nombre: "Juan Pérez",
      email: "juan.perez@email.com",
      telefono: "+56 9 1111 2222",
      empresa: "Constructora Los Pinos",
      cargo: "Gerente de Operaciones",
      tipo_cliente: "empresa",
      estado: "pendiente",
      fecha_solicitud: new Date(),
      comentarios: "Interesado en servicios de mantención de flota"
    },
    {
      nombre: "María González",
      email: "maria.gonzalez@email.com",
      telefono: "+56 9 3333 4444", 
      empresa: "",
      cargo: "",
      tipo_cliente: "particular",
      estado: "pendiente",
      fecha_solicitud: new Date(Date.now() - 86400000),
      comentarios: "Busca talleres de confianza para su vehículo particular"
    }
  ];

  for (let i = 0; i < solicitudesClientes.length; i++) {
    try {
      const docRef = await addDoc(collection(db, "solicitudes_cliente"), solicitudesClientes[i]);
      console.log(`✅ Solicitud cliente ${i + 1}/2 creada:`, solicitudesClientes[i].nombre, "ID:", docRef.id);
    } catch (error) {
      console.error(`❌ Error creando solicitud cliente ${i + 1}:`, error);
    }
  }
  
  console.log("🎉 Solicitudes de clientes creadas");
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

// Exportar las funciones
export { 
  crearEmpresaEjemplo, 
  crearTodasLasEmpresas, 
  crearSolicitudesEjemplo,
  crearSolicitudesClientesEjemplo,
  crearCampañaEjemplo, 
  empresasEjemplo 
};