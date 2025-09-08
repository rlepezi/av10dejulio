import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

// Datos de centros de revisión técnica de Santiago
const centrosRevisionTecnica = [
  {
    nombre: "Centro de Revisión Técnica Las Condes",
    direccion: "Av. Apoquindo 5555, Las Condes",
    comuna: "Las Condes",
    region: "Metropolitana",
    telefono: "+56-2-2234-5678",
    horarios: "Lunes a Viernes: 8:00 - 18:00, Sábados: 9:00 - 14:00",
    tiposVehiculo: ["automovil", "camioneta", "moto"],
    disponibilidad: "disponible",
    precio: {
      automovil: 35000,
      camioneta: 40000,
      moto: 25000
    },
    serviciosAdicionales: ["Verificación de gases", "Revisión de luces", "Control de frenos"],
    email: "contacto@rtlascondes.cl",
    sitioWeb: "www.rtlascondes.cl"
  },
  {
    nombre: "Revisión Técnica Express Providencia",
    direccion: "Av. Providencia 2200, Providencia",
    comuna: "Providencia",
    region: "Metropolitana", 
    telefono: "+56-2-2345-6789",
    horarios: "Lunes a Viernes: 8:30 - 19:00, Sábados: 8:30 - 15:00",
    tiposVehiculo: ["automovil", "camioneta", "bus", "camion"],
    disponibilidad: "disponible",
    precio: {
      automovil: 32000,
      camioneta: 38000,
      bus: 55000,
      camion: 65000
    },
    serviciosAdicionales: ["Revisión express (30 min)", "Agendamiento online", "Diagnóstico computarizado"],
    email: "info@rtexpress.cl",
    sitioWeb: "www.rtexpress.cl"
  },
  {
    nombre: "Centro RT Ñuñoa",
    direccion: "Av. Irarrázaval 3456, Ñuñoa",
    comuna: "Ñuñoa", 
    region: "Metropolitana",
    telefono: "+56-2-2456-7890",
    horarios: "Lunes a Viernes: 8:00 - 17:30, Sábados: 9:00 - 13:00",
    tiposVehiculo: ["automovil", "camioneta", "moto"],
    disponibilidad: "disponible",
    precio: {
      automovil: 30000,
      camioneta: 35000,
      moto: 22000
    },
    serviciosAdicionales: ["Revisión básica", "Control de emisiones", "Verificación de seguridad"],
    email: "contacto@rtnunoa.cl",
    sitioWeb: "www.rtnunoa.cl"
  },
  {
    nombre: "Revisión Técnica Maipú",
    direccion: "Av. Pajaritos 4567, Maipú",
    comuna: "Maipú",
    region: "Metropolitana",
    telefono: "+56-2-2567-8901", 
    horarios: "Lunes a Viernes: 8:00 - 18:30, Sábados: 8:30 - 14:30",
    tiposVehiculo: ["automovil", "camioneta", "bus", "camion", "moto"],
    disponibilidad: "disponible",
    precio: {
      automovil: 28000,
      camioneta: 33000,
      bus: 50000,
      camion: 60000,
      moto: 20000
    },
    serviciosAdicionales: ["Revisión completa", "Inspección técnica", "Certificación vehicular"],
    email: "info@rtmaipu.cl",
    sitioWeb: "www.rtmaipu.cl"
  },
  {
    nombre: "Centro de Revisión San Miguel", 
    direccion: "Gran Avenida 5678, San Miguel",
    comuna: "San Miguel",
    region: "Metropolitana",
    telefono: "+56-2-2678-9012",
    horarios: "Lunes a Viernes: 8:30 - 17:00, Sábados: 9:00 - 12:00",
    tiposVehiculo: ["automovil", "camioneta"],
    disponibilidad: "disponible",
    precio: {
      automovil: 29000,
      camioneta: 34000
    },
    serviciosAdicionales: ["Revisión estándar", "Control de gases", "Verificación de luces"],
    email: "contacto@rtsanmiguel.cl",
    sitioWeb: "www.rtsanmiguel.cl"
  },
  {
    nombre: "RT Vitacura Premium",
    direccion: "Av. Vitacura 6789, Vitacura", 
    comuna: "Vitacura",
    region: "Metropolitana",
    telefono: "+56-2-2789-0123",
    horarios: "Lunes a Viernes: 8:00 - 19:00, Sábados: 9:00 - 16:00",
    tiposVehiculo: ["automovil", "camioneta", "moto"],
    disponibilidad: "disponible",
    precio: {
      automovil: 38000,
      camioneta: 43000,
      moto: 28000
    },
    serviciosAdicionales: ["Servicio premium", "Sala de espera VIP", "Café y wifi gratuito", "Lavado básico incluido"],
    email: "premium@rtvitacura.cl",
    sitioWeb: "www.rtvitacura.cl"
  },
  {
    nombre: "Revisión Técnica Puente Alto",
    direccion: "Av. Concha y Toro 7890, Puente Alto",
    comuna: "Puente Alto",
    region: "Metropolitana",
    telefono: "+56-2-2890-1234",
    horarios: "Lunes a Viernes: 8:00 - 18:00, Sábados: 8:30 - 14:00",
    tiposVehiculo: ["automovil", "camioneta", "bus", "camion"],
    disponibilidad: "no_disponible", // Temporalmente cerrado por mantención
    precio: {
      automovil: 27000,
      camioneta: 32000,
      bus: 48000,
      camion: 58000
    },
    serviciosAdicionales: ["Revisión económica", "Control básico", "Certificación estándar"],
    email: "info@rtpuentealto.cl",
    sitioWeb: "www.rtpuentealto.cl"
  },
  {
    nombre: "Centro RT La Florida",
    direccion: "Av. Vicuña Mackenna 8901, La Florida",
    comuna: "La Florida", 
    region: "Metropolitana",
    telefono: "+56-2-2901-2345",
    horarios: "Lunes a Viernes: 8:30 - 17:30, Sábados: 9:00 - 13:30",
    tiposVehiculo: ["automovil", "camioneta", "moto"],
    disponibilidad: "disponible",
    precio: {
      automovil: 31000,
      camioneta: 36000,
      moto: 23000
    },
    serviciosAdicionales: ["Revisión rápida", "Control de emisiones", "Verificación completa"],
    email: "contacto@rtlaflorida.cl",
    sitioWeb: "www.rtlaflorida.cl"
  }
];

// Función para inicializar los datos de centros de revisión técnica
export const initializeCentrosRevision = async () => {
  try {
    // Verificar si ya existen centros
    const existingCentros = await getDocs(collection(db, 'centros_revision'));
    
    if (existingCentros.size > 0) {
      console.log('Los centros de revisión técnica ya están inicializados');
      return;
    }

    console.log('Inicializando centros de revisión técnica...');

    // Agregar cada centro a Firestore
    for (const centro of centrosRevisionTecnica) {
      await addDoc(collection(db, 'centros_revision'), {
        ...centro,
        fechaCreacion: new Date(),
        activo: true
      });
    }

    console.log(`✅ Se inicializaron ${centrosRevisionTecnica.length} centros de revisión técnica`);
  } catch (error) {
    console.error('Error inicializando centros de revisión técnica:', error);
  }
};

// Función para obtener centros por comuna
export const getCentrosPorComuna = async (comuna) => {
  try {
    const q = query(
      collection(db, 'centros_revision'),
      where('comuna', '==', comuna)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error obteniendo centros por comuna:', error);
    return [];
  }
};

// Función para obtener centros disponibles
export const getCentrosDisponibles = async () => {
  try {
    const q = query(
      collection(db, 'centros_revision'),
      where('disponibilidad', '==', 'disponible')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error obteniendo centros disponibles:', error);
    return [];
  }
};

