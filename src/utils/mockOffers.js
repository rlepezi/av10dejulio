// Datos de prueba para ofertas exclusivas
export const mockOffers = [
  {
    id: 'offer_001',
    titulo: '20% Descuento en Cambio de Aceite',
    descripcion: 'Descuento especial en cambio de aceite para miembros de la comunidad',
    empresa: 'Taller Mecánico Central',
    puntosRequeridos: 50,
    fechaVencimiento: '31 Dic 2024',
    activa: true,
    categoria: 'mantenimiento',
    descuento: 20,
    servicios: ['cambio_aceite', 'mantenimiento'],
    condiciones: 'Válido solo para vehículos con menos de 10 años'
  },
  {
    id: 'offer_002',
    titulo: '2x1 en Vulcanizaciones',
    descripcion: 'Promoción especial: paga una vulcanización y lleva otra gratis',
    empresa: 'Vulcanizadora Express',
    puntosRequeridos: 100,
    fechaVencimiento: '15 Ene 2025',
    activa: true,
    categoria: 'neumaticos',
    descuento: 50,
    servicios: ['vulcanizacion', 'neumaticos'],
    condiciones: 'Válido para vulcanizaciones de hasta $30,000'
  },
  {
    id: 'offer_003',
    titulo: '15% Descuento en Repuestos',
    descripcion: 'Descuento en repuestos originales y compatibles',
    empresa: 'Auto Parts Premium',
    puntosRequeridos: 75,
    fechaVencimiento: '28 Dic 2024',
    activa: true,
    categoria: 'repuestos',
    descuento: 15,
    servicios: ['repuestos', 'accesorios'],
    condiciones: 'Descuento aplicable en compras superiores a $50,000'
  },
  {
    id: 'offer_004',
    titulo: 'Diagnóstico Gratuito',
    descripcion: 'Diagnóstico completo del vehículo sin costo',
    empresa: 'Diagnóstico Pro',
    puntosRequeridos: 30,
    fechaVencimiento: '20 Ene 2025',
    activa: true,
    categoria: 'diagnostico',
    descuento: 100,
    servicios: ['diagnostico', 'revision'],
    condiciones: 'Válido para vehículos de todas las marcas'
  },
  {
    id: 'offer_005',
    titulo: 'Lavado Premium Gratuito',
    descripcion: 'Lavado completo del vehículo con encerado incluido',
    empresa: 'Car Wash Premium',
    puntosRequeridos: 25,
    fechaVencimiento: '10 Feb 2025',
    activa: true,
    categoria: 'estetica',
    descuento: 100,
    servicios: ['lavado', 'encerado'],
    condiciones: 'Válido de lunes a viernes'
  },
  {
    id: 'offer_006',
    titulo: '10% Descuento en Frenos',
    descripcion: 'Descuento especial en sistema de frenos completo',
    empresa: 'Frenos & Más',
    puntosRequeridos: 80,
    fechaVencimiento: '25 Ene 2025',
    activa: true,
    categoria: 'frenos',
    descuento: 10,
    servicios: ['frenos', 'pastillas', 'discos'],
    condiciones: 'Incluye mano de obra y repuestos'
  }
];

// Función para obtener ofertas por nivel de membresía
export const getOffersByMembershipLevel = (nivel, puntos) => {
  return mockOffers.filter(offer => {
    // Verificar si el usuario tiene suficientes puntos
    if (offer.puntosRequeridos > puntos) return false;
    
    // Verificar si la oferta está activa
    if (!offer.activa) return false;
    
    // Verificar fecha de vencimiento
    const fechaVencimiento = new Date(offer.fechaVencimiento);
    if (fechaVencimiento < new Date()) return false;
    
    return true;
  });
};

// Función para obtener ofertas por categoría
export const getOffersByCategory = (categoria) => {
  return mockOffers.filter(offer => 
    offer.categoria === categoria && offer.activa
  );
};

// Función para simular canje de oferta
export const redeemOffer = async (offerId, clienteId) => {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const offer = mockOffers.find(o => o.id === offerId);
  if (!offer) {
    throw new Error('Oferta no encontrada');
  }
  
  // Simular éxito del canje
  return {
    success: true,
    offerId,
    clienteId,
    fechaCanje: new Date(),
    puntosGastados: offer.puntosRequeridos
  };
};
