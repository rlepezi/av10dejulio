# Debug: Empresas Manuales No Visibles en Panel de Validación

## Problema Reportado

El usuario ingresó una nueva empresa manualmente como admin:

```javascript
{
  nombre: "Desarmaduria Ipar",
  categoria: "Repuestos",
  creado_por: "admin",
  estado: "ingresada",
  fecha_creacion: Timestamp,
  sitio_web: "http://www.desarmaduriaipar.cl/",
  logo_url: "gs://...",
  tipo_empresa: "publica",
  es_comunidad: false,
  marcas: ["ysrwa49ZG3gY8a1tjbJg"],
  horario_atencion: "lunes, 9:20 a. m.–6:20 p. m. sábado, 9:20 a. m.–1:50 p. m., domingo, Cerrado"
}
```

**Pero no aparece en el listado de `/admin/panel-validacion`**

## Análisis del Problema

### 1. Estructura de Datos Diferente

La empresa manual tiene campos como:
- `fecha_creacion` (no `fechaCreacion`)
- `sitio_web` (no `web`)
- `logo_url` (no `logo`)
- `categoria` (no `rubro`)
- `horario_atencion` (no `horarios`)

### 2. Posibles Causas

1. **Orden de consulta incorrecto**: Se estaba ordenando por `fechaCreacion` en lugar de `fecha_creacion`
2. **Filtrado incorrecto**: El filtro podría no estar reconociendo el estado `"ingresada"`
3. **Normalización fallida**: La función de normalización podría estar fallando
4. **Cache de datos**: Los datos podrían estar cacheados y no actualizarse

## Solución Implementada

### 1. Corrección del Orden de Consulta

```javascript
// ANTES (incorrecto)
const { data: todasLasEmpresas, loading } = useFirestoreCollection('empresas', {
  orderBy: ['fechaCreacion', 'desc']
});

// DESPUÉS (correcto)
const { data: todasLasEmpresas, loading } = useFirestoreCollection('empresas', {
  orderBy: ['fecha_creacion', 'desc']
});
```

### 2. Mejora de la Función de Normalización

```javascript
const normalizarEmpresa = (empresa) => {
  const empresaNormalizada = {
    // ... campos básicos
    web: empresa.web || empresa.sitio_web,
    logo: empresa.logo || empresa.logo_url,
    logoAsignado: empresa.logoAsignado || !!(empresa.logo || empresa.logo_url),
    categoria: empresa.categoria || empresa.rubro,
    fechaCreacion: empresa.fechaCreacion || empresa.fecha_creacion,
    horarios: empresa.horarios?.general || empresa.horarios || empresa.horario_atencion,
    // ... campos adicionales
  };
  
  console.log('🔧 Normalizando empresa:', empresa.nombre, empresaNormalizada);
  return empresaNormalizada;
};
```

### 3. Logs de Depuración Agregados

```javascript
// Log de empresas obtenidas
console.log('🔍 Empresas obtenidas de Firestore:', todasLasEmpresas);
console.log('🔍 Empresas con estado "ingresada":', todasLasEmpresas?.filter(e => e.estado === 'ingresada'));

// Log de filtrado
console.log(`🔍 Empresa ${empresa.nombre} (${empresa.estado}) - Cumple filtro: ${cumpleFiltro}`);

// Log de empresas filtradas y normalizadas
console.log('🔍 Empresas filtradas y normalizadas:', empresasPendientes);
```

### 4. Botón de Recarga Agregado

```javascript
<button
  onClick={() => window.location.reload()}
  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
>
  🔄 Recargar
</button>
```

## Pasos para Verificar

### 1. Abrir Consola del Navegador
1. Ir a `/admin/panel-validacion`
2. Abrir DevTools (F12)
3. Ir a la pestaña Console

### 2. Verificar Logs
Deberías ver logs como:
```
🔍 Empresas obtenidas de Firestore: [Array de empresas]
🔍 Empresas con estado "ingresada": [Array de empresas ingresadas]
🔧 Normalizando empresa: Desarmaduria Ipar {...}
🔍 Empresa Desarmaduria Ipar (ingresada) - Cumple filtro: true
🔍 Empresas filtradas y normalizadas: [Array de empresas normalizadas]
```

### 3. Si No Aparecen Logs
- Hacer clic en "🔄 Recargar"
- Verificar que la consola muestre los logs
- Verificar que la empresa "Desarmaduria Ipar" aparezca en los logs

### 4. Si Aparecen en Logs pero No en UI
- Verificar que `empresasPendientes` contenga la empresa
- Verificar que el componente se esté renderizando correctamente
- Verificar que no haya errores en la consola

## Campos Específicos de la Empresa Manual

### ✅ Campos Identificados:
- **nombre**: "Desarmaduria Ipar"
- **categoria**: "Repuestos"
- **estado**: "ingresada"
- **sitio_web**: "http://www.desarmaduriaipar.cl/"
- **logo_url**: "gs://..."
- **tipo_empresa**: "publica"
- **creado_por**: "admin"
- **fecha_creacion**: Timestamp
- **marcas**: ["ysrwa49ZG3gY8a1tjbJg"]
- **horario_atencion**: "lunes, 9:20 a. m.–6:20 p. m. sábado, 9:20 a. m.–1:50 p. m., domingo, Cerrado"

### ✅ Campos Manejados por Normalización:
- **web**: `sitio_web` → "http://www.desarmaduriaipar.cl/"
- **logo**: `logo_url` → "gs://..."
- **categoria**: `categoria` → "Repuestos"
- **fechaCreacion**: `fecha_creacion` → Timestamp
- **horarios**: `horario_atencion` → "lunes, 9:20 a. m.–6:20 p. m. sábado, 9:20 a. m.–1:50 p. m., domingo, Cerrado"

## Próximos Pasos

1. **Verificar logs en consola** para identificar dónde falla el proceso
2. **Confirmar que la empresa aparece** en los logs de Firestore
3. **Verificar que pasa el filtro** de estado "ingresada"
4. **Confirmar que se normaliza correctamente**
5. **Verificar que se renderiza** en la interfaz

## Archivos Modificados

### ✅ `src/components/PanelValidacionAvanzado.jsx`
- **Orden de consulta**: Cambiado de `fechaCreacion` a `fecha_creacion`
- **Función de normalización**: Mejorada para manejar todos los campos
- **Logs de depuración**: Agregados en puntos clave
- **Botón de recarga**: Agregado para forzar actualización
