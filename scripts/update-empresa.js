import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

// Configuración de Firebase (usar la del proyecto)
const firebaseConfig = {
  apiKey: "AIzaSyBMnY_KvXVBJ4LGJxVcGjXvTlSGhkXFQqQ",
  authDomain: "directorio-empresas-2024.firebaseapp.com",
  projectId: "directorio-empresas-2024",
  storageBucket: "directorio-empresas-2024.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateEmpresaCompleta() {
  const empresaId = 'uAXNtDSJVmydSX70UDK8';
  
  try {
    // Primero verificar si la empresa existe
    const empresaRef = doc(db, 'empresas', empresaId);
    const empresaSnap = await getDoc(empresaRef);
    
    if (!empresaSnap.exists()) {
      console.log('❌ Empresa no encontrada con ID:', empresaId);
      return;
    }
    
    console.log('📋 Empresa encontrada:', empresaSnap.data().nombre);
    
    // Actualizar con datos completos
    const datosCompletos = {
      servicios: [
        "Reparación de Motor",
        "Cambio de Aceite", 
        "Alineación",
        "Balanceado",
        "Frenos",
        "Suspensión",
        "Sistema Eléctrico",
        "Air Bag",
        "Transmisión",
        "Radiador"
      ],
      marcas: [
        "Toyota",
        "Chevrolet", 
        "Ford",
        "Nissan",
        "Hyundai",
        "Kia",
        "Mazda",
        "Honda",
        "Volkswagen",
        "Renault"
      ],
      galeria: [
        "https://images.unsplash.com/photo-1486312338219-ce68e2c6b322?w=400",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", 
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400",
        "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=400"
      ],
      logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200",
      logoAsignado: true,
      caracteristicas: [
        "Más de 15 años de experiencia",
        "Técnicos certificados",
        "Equipos de última tecnología", 
        "Garantía en todos los trabajos",
        "Atención personalizada",
        "Diagnóstico computarizado"
      ],
      horarios: {
        lunes: { abierto: true, apertura: "08:00", cierre: "18:00", turno_continuo: true },
        martes: { abierto: true, apertura: "08:00", cierre: "18:00", turno_continuo: true },
        miercoles: { abierto: true, apertura: "08:00", cierre: "18:00", turno_continuo: true },
        jueves: { abierto: true, apertura: "08:00", cierre: "18:00", turno_continuo: true },
        viernes: { abierto: true, apertura: "08:00", cierre: "18:00", turno_continuo: true },
        sabado: { abierto: true, apertura: "09:00", cierre: "14:00", turno_continuo: true },
        domingo: { abierto: false }
      },
      descripcionCompleta: "Taller mecánico especializado con más de 15 años de experiencia en el rubro automotriz. Contamos con técnicos certificados y equipos de última tecnología para brindar el mejor servicio. Trabajamos con todas las marcas de vehículos y ofrecemos garantía en todos nuestros trabajos.",
      contactoAdicional: {
        whatsapp: "+56912345678",
        facebook: "TallerMecanico",
        instagram: "@taller_mecanico"
      },
      estado: "activa"
    };
    
    await updateDoc(empresaRef, datosCompletos);
    console.log('✅ Empresa actualizada exitosamente con todos los datos');
    
    // Mostrar resumen
    console.log('📊 Resumen de actualización:');
    console.log(`   - Servicios: ${datosCompletos.servicios.length}`);
    console.log(`   - Marcas: ${datosCompletos.marcas.length}`);
    console.log(`   - Imágenes galería: ${datosCompletos.galeria.length}`);
    console.log(`   - Características: ${datosCompletos.caracteristicas.length}`);
    console.log(`   - Logo asignado: ${datosCompletos.logoAsignado ? 'Sí' : 'No'}`);
    
  } catch (error) {
    console.error('❌ Error al actualizar empresa:', error);
  }
}

// Ejecutar la actualización
updateEmpresaCompleta();
