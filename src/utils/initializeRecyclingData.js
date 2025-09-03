import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// Empresas de reciclaje de ejemplo
const empresasReciclajeEjemplo = [
  {
    nombre: 'Reciclaje Automotriz 10 de Julio',
    direccion: 'Av. Principal 123, Centro, 10 de Julio',
    telefono: '+54 11 1234-5678',
    email: 'info@reciclaje10dejulio.com',
    descripcion: 'Especialistas en reciclaje de aceites, baterías y neumáticos automotrices. Servicio profesional y responsable con el medio ambiente.',
    categorias: ['reciclaje', 'automotriz', 'medioambiente'],
    serviciosReciclaje: ['aceite_motor', 'aceite_transmision', 'baterias', 'neumaticos', 'filtros', 'liquidos_frenos'],
    zonaServicio: ['Centro', 'Norte', 'Sur'],
    horarios: {
      lunes: { abierto: true, inicio: '08:00', fin: '18:00' },
      martes: { abierto: true, inicio: '08:00', fin: '18:00' },
      miercoles: { abierto: true, inicio: '08:00', fin: '18:00' },
      jueves: { abierto: true, inicio: '08:00', fin: '18:00' },
      viernes: { abierto: true, inicio: '08:00', fin: '18:00' },
      sabado: { abierto: true, inicio: '08:00', fin: '14:00' },
      domingo: { abierto: false, inicio: '09:00', fin: '18:00' }
    },
    condiciones: {
      aceiteGratis: true,
      bateriasGratis: true,
      neumaticosGratis: false,
      otrosGratis: true
    },
    certificaciones: ['ISO 14001 - Gestión Ambiental', 'Certificación de Reciclaje'],
    estado: 'activa',
    fechaCreacion: new Date(),
    rating: 4.8,
    totalReviews: 15
  },
  {
    nombre: 'EcoRecicla Automotriz',
    direccion: 'Calle Industrial 456, Zona Industrial, 10 de Julio',
    telefono: '+54 11 2345-6789',
    email: 'contacto@ecorecicla.com',
    descripcion: 'Empresa líder en reciclaje sostenible de componentes automotrices. Comprometida con la economía circular.',
    categorias: ['reciclaje', 'automotriz', 'sostenibilidad'],
    serviciosReciclaje: ['aceite_motor', 'baterias', 'neumaticos', 'metales', 'plasticos', 'vidrio'],
    zonaServicio: ['Zona Industrial', 'Este', 'Oeste'],
    horarios: {
      lunes: { abierto: true, inicio: '07:00', fin: '19:00' },
      martes: { abierto: true, inicio: '07:00', fin: '19:00' },
      miercoles: { abierto: true, inicio: '07:00', fin: '19:00' },
      jueves: { abierto: true, inicio: '07:00', fin: '19:00' },
      viernes: { abierto: true, inicio: '07:00', fin: '19:00' },
      sabado: { abierto: false, inicio: '09:00', fin: '18:00' },
      domingo: { abierto: false, inicio: '09:00', fin: '18:00' }
    },
    condiciones: {
      aceiteGratis: true,
      bateriasGratis: true,
      neumaticosGratis: true,
      otrosGratis: false
    },
    certificaciones: ['ISO 14001 - Gestión Ambiental', 'Licencia Ambiental', 'Certificación de Calidad'],
    estado: 'activa',
    fechaCreacion: new Date(),
    rating: 4.6,
    totalReviews: 23
  },
  {
    nombre: 'Green Auto Recycling',
    direccion: 'Ruta Provincial 789, Zona Comercial, 10 de Julio',
    telefono: '+54 11 3456-7890',
    email: 'info@greenautorecycling.com',
    descripcion: 'Centro de reciclaje moderno con tecnología de punta para el procesamiento de residuos automotrices.',
    categorias: ['reciclaje', 'automotriz', 'tecnologia'],
    serviciosReciclaje: ['aceite_motor', 'aceite_transmision', 'baterias', 'neumaticos', 'filtros', 'liquidos_frenos', 'liquidos_refrigerante', 'aceite_direccion'],
    zonaServicio: ['Zona Comercial', 'Centro', 'Norte'],
    horarios: {
      lunes: { abierto: true, inicio: '09:00', fin: '17:00' },
      martes: { abierto: true, inicio: '09:00', fin: '17:00' },
      miercoles: { abierto: true, inicio: '09:00', fin: '17:00' },
      jueves: { abierto: true, inicio: '09:00', fin: '17:00' },
      viernes: { abierto: true, inicio: '09:00', fin: '17:00' },
      sabado: { abierto: true, inicio: '09:00', fin: '13:00' },
      domingo: { abierto: false, inicio: '09:00', fin: '18:00' }
    },
    condiciones: {
      aceiteGratis: false,
      bateriasGratis: true,
      neumaticosGratis: false,
      otrosGratis: true
    },
    certificaciones: ['ISO 14001 - Gestión Ambiental', 'Normas de Seguridad Industrial'],
    estado: 'activa',
    fechaCreacion: new Date(),
    rating: 4.4,
    totalReviews: 18
  },
  {
    nombre: 'ReciclaFácil Express',
    direccion: 'Av. Comercial 321, Zona Residencial, 10 de Julio',
    telefono: '+54 11 4567-8901',
    email: 'servicio@reciclafacil.com',
    descripcion: 'Servicio rápido y eficiente de reciclaje automotriz. Recogemos en domicilio y reciclamos responsablemente.',
    categorias: ['reciclaje', 'automotriz', 'servicio'],
    serviciosReciclaje: ['aceite_motor', 'baterias', 'neumaticos', 'filtros', 'liquidos_frenos'],
    zonaServicio: ['Zona Residencial', 'Sur', 'Este'],
    horarios: {
      lunes: { abierto: true, inicio: '08:00', fin: '20:00' },
      martes: { abierto: true, inicio: '08:00', fin: '20:00' },
      miercoles: { abierto: true, inicio: '08:00', fin: '20:00' },
      jueves: { abierto: true, inicio: '08:00', fin: '20:00' },
      viernes: { abierto: true, inicio: '08:00', fin: '20:00' },
      sabado: { abierto: true, inicio: '08:00', fin: '18:00' },
      domingo: { abierto: true, inicio: '09:00', fin: '16:00' }
    },
    condiciones: {
      aceiteGratis: true,
      bateriasGratis: true,
      neumaticosGratis: true,
      otrosGratis: true
    },
    certificaciones: ['Certificación de Reciclaje'],
    estado: 'activa',
    fechaCreacion: new Date(),
    rating: 4.9,
    totalReviews: 31
  }
];

export const initializeRecyclingData = async () => {
  try {
    console.log('🔄 Inicializando datos de reciclaje...');
    
    // Verificar si ya existen empresas de reciclaje
    const empresasQuery = query(
      collection(db, 'empresas'),
      where('categorias', 'array-contains', 'reciclaje')
    );
    const empresasSnapshot = await getDocs(empresasQuery);
    
    console.log(`📊 Empresas de reciclaje encontradas: ${empresasSnapshot.size}`);
    
    if (empresasSnapshot.empty) {
      console.log('🏭 No hay empresas de reciclaje, creando ejemplos...');
      
      // Crear empresas de ejemplo
      for (const empresa of empresasReciclajeEjemplo) {
        try {
          const docRef = await addDoc(collection(db, 'empresas'), empresa);
          console.log(`✅ Empresa creada: ${empresa.nombre} (ID: ${docRef.id})`);
        } catch (error) {
          console.error(`❌ Error creando empresa ${empresa.nombre}:`, error);
        }
      }
      
      console.log('🎉 Datos de reciclaje inicializados correctamente');
    } else {
      console.log('✅ Ya existen empresas de reciclaje en la base de datos');
      empresasSnapshot.docs.forEach(doc => {
        console.log(`📋 Empresa existente: ${doc.data().nombre} (ID: ${doc.id})`);
      });
    }
  } catch (error) {
    console.error('❌ Error inicializando datos de reciclaje:', error);
  }
};
