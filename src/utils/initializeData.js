import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// Datos de ejemplo para compañías de seguros
const companiasSeguros = [
  {
    nombre: 'Mapfre',
    logo: '/images/mapfre-logo.png',
    rating: 4.2,
    factor: 1.0,
    descripcion: 'Seguro automotriz completo con cobertura nacional',
    cobertura: ['Responsabilidad Civil', 'Daños Propios', 'Robo', 'Incendio'],
    telefono: '+56 2 2000 0000',
    email: 'contacto@mapfre.cl',
    sitioWeb: 'https://www.mapfre.cl'
  },
  {
    nombre: 'Zurich',
    logo: '/images/zurich-logo.png',
    rating: 4.5,
    factor: 1.1,
    descripcion: 'Seguros premium con servicio de asistencia 24/7',
    cobertura: ['Responsabilidad Civil', 'Daños Propios', 'Robo', 'Incendio', 'Fenómenos Naturales'],
    telefono: '+56 2 2100 0000',
    email: 'seguros@zurich.cl',
    sitioWeb: 'https://www.zurich.cl'
  },
  {
    nombre: 'Liberty',
    logo: '/images/liberty-logo.png',
    rating: 4.0,
    factor: 0.95,
    descripcion: 'Seguros accesibles con planes flexibles',
    cobertura: ['Responsabilidad Civil', 'Daños Propios', 'Robo'],
    telefono: '+56 2 2200 0000',
    email: 'info@liberty.cl',
    sitioWeb: 'https://www.liberty.cl'
  }
];

// Datos de ejemplo para centros de revisión técnica
const centrosRevision = [
  {
    nombre: 'PRT Santiago Centro',
    direccion: 'Av. Libertador Bernardo O\'Higgins 1234',
    comuna: 'Santiago',
    region: 'RM',
    telefono: '+56 2 2300 0000',
    rating: 4.3,
    precioBase: 25000,
    tiempoPromedio: 45,
    horarios: 'L-V 8:00-18:00, S 8:00-14:00',
    servicios: ['Revisión Anual', 'Revisión Semestral', 'Primera Vez', 'Reinspección'],
    latitud: -33.4489,
    longitud: -70.6693
  },
  {
    nombre: 'Centro Técnico Las Condes',
    direccion: 'Av. Apoquindo 5678',
    comuna: 'Las Condes',
    region: 'RM',
    telefono: '+56 2 2400 0000',
    rating: 4.6,
    precioBase: 28000,
    tiempoPromedio: 40,
    horarios: 'L-V 8:30-19:00, S 9:00-15:00',
    servicios: ['Revisión Anual', 'Revisión Semestral', 'Primera Vez', 'Reinspección', 'Gases'],
    latitud: -33.4150,
    longitud: -70.5747
  },
  {
    nombre: 'Revisión Técnica Maipú',
    direccion: 'Av. Pajaritos 9876',
    comuna: 'Maipú',
    region: 'RM',
    telefono: '+56 2 2500 0000',
    rating: 4.1,
    precioBase: 23000,
    tiempoPromedio: 50,
    horarios: 'L-V 8:00-17:30, S 8:30-13:00',
    servicios: ['Revisión Anual', 'Revisión Semestral', 'Primera Vez'],
    latitud: -33.5123,
    longitud: -70.7507
  }
];

// Datos de ejemplo para vulcanizadoras
const vulcanizadoras = [
  {
    nombre: 'Vulcanización Express',
    direccion: 'Av. Grecia 1234',
    comuna: 'Ñuñoa',
    telefono: '+56 9 8765 4321',
    rating: 4.4,
    precioBase: 15000,
    tiempoRespuesta: 15,
    horarios: 'L-D 8:00-22:00',
    emergencia24h: true,
    servicioDomicilio: true,
    promociones: true,
    servicios: ['parche', 'cambio_neumatico', 'balanceado', 'alineacion', 'valvula'],
    precios: {
      parche: 8000,
      cambio_neumatico: 5000,
      balanceado: 12000,
      alineacion: 25000,
      valvula: 3000
    },
    latitud: -33.4569,
    longitud: -70.5874
  },
  {
    nombre: 'Neumáticos del Sur',
    direccion: 'Av. Vicuña Mackenna 5678',
    comuna: 'La Florida',
    telefono: '+56 9 7654 3210',
    rating: 4.2,
    precioBase: 12000,
    tiempoRespuesta: 20,
    horarios: 'L-S 8:30-20:00',
    emergencia24h: false,
    servicioDomicilio: true,
    promociones: false,
    servicios: ['parche', 'cambio_neumatico', 'balanceado', 'rotacion'],
    precios: {
      parche: 7000,
      cambio_neumatico: 4500,
      balanceado: 10000,
      rotacion: 8000
    },
    latitud: -33.5206,
    longitud: -70.5986
  },
  {
    nombre: 'Vulca Rápido 24H',
    direccion: 'Av. Providencia 9876',
    comuna: 'Providencia',
    telefono: '+56 9 6543 2109',
    rating: 4.7,
    precioBase: 18000,
    tiempoRespuesta: 10,
    horarios: '24 horas',
    emergencia24h: true,
    servicioDomicilio: true,
    promociones: true,
    servicios: ['parche', 'cambio_neumatico', 'balanceado', 'alineacion', 'valvula', 'rotacion'],
    precios: {
      parche: 10000,
      cambio_neumatico: 6000,
      balanceado: 15000,
      alineacion: 30000,
      valvula: 4000,
      rotacion: 12000
    },
    latitud: -33.4255,
    longitud: -70.6118
  }
];

// Datos de ejemplo para tipos de seguros
const tiposSeguros = [
  {
    nombre: 'Responsabilidad Civil',
    descripcion: 'Cobertura obligatoria por daños a terceros',
    obligatorio: true
  },
  {
    nombre: 'Daños Propios',
    descripcion: 'Cobertura para daños en tu propio vehículo',
    obligatorio: false
  },
  {
    nombre: 'Robo e Incendio',
    descripcion: 'Protección contra robo total y daños por incendio',
    obligatorio: false
  },
  {
    nombre: 'Fenómenos Naturales',
    descripcion: 'Cobertura para daños por terremotos, inundaciones, etc.',
    obligatorio: false
  }
];

export const initializeServiceData = async () => {
  try {
    console.log('Inicializando datos de servicios...');

    // Verificar si ya existen datos
    const companiasSnapshot = await getDocs(collection(db, 'companias_seguros'));
    if (companiasSnapshot.empty) {
      console.log('Agregando compañías de seguros...');
      for (const compania of companiasSeguros) {
        await addDoc(collection(db, 'companias_seguros'), compania);
      }
    }

    const centrosSnapshot = await getDocs(collection(db, 'centros_revision'));
    if (centrosSnapshot.empty) {
      console.log('Agregando centros de revisión técnica...');
      for (const centro of centrosRevision) {
        await addDoc(collection(db, 'centros_revision'), centro);
      }
    }

    const vulcanizadorasSnapshot = await getDocs(collection(db, 'vulcanizadoras'));
    if (vulcanizadorasSnapshot.empty) {
      console.log('Agregando vulcanizadoras...');
      for (const vulcanizadora of vulcanizadoras) {
        await addDoc(collection(db, 'vulcanizadoras'), vulcanizadora);
      }
    }

    const tiposSnapshot = await getDocs(collection(db, 'tipos_seguros'));
    if (tiposSnapshot.empty) {
      console.log('Agregando tipos de seguros...');
      for (const tipo of tiposSeguros) {
        await addDoc(collection(db, 'tipos_seguros'), tipo);
      }
    }

    console.log('Datos de servicios inicializados correctamente');
    return true;
  } catch (error) {
    console.error('Error inicializando datos de servicios:', error);
    return false;
  }
};

// Función para agregar recordatorios de marzo (permiso de circulación)
export const createMarchReminders = async (userId) => {
  try {
    const marchDate = new Date();
    marchDate.setMonth(2); // Marzo (0-indexed)
    marchDate.setDate(31); // Último día de marzo
    
    const recordatorio = {
      userId,
      titulo: 'Renovación Permiso de Circulación',
      descripcion: 'Renovar el permiso de circulación antes del 31 de marzo',
      tipo: 'permiso_circulacion',
      fechaProxima: marchDate,
      estado: 'activo',
      recurrente: true,
      fechaCreacion: new Date()
    };
    
    await addDoc(collection(db, 'recordatorios'), recordatorio);
    console.log('Recordatorio de marzo creado');
  } catch (error) {
    console.error('Error creando recordatorio de marzo:', error);
  }
};
