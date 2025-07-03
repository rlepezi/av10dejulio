import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

export default function DetalleProducto({ idProducto, onVolver }) {
  const [producto, setProducto] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [productoAnterior, setProductoAnterior] = useState(null); // Solo uno, no array
  const [loading, setLoading] = useState(true);
  const [palabraClave, setPalabraClave] = useState("");

  useEffect(() => {
    const cargarDetalle = async () => {
      setLoading(true);
      const docSnap = await getDoc(doc(db, "productos", idProducto));
      if (docSnap.exists()) {
        const prodData = { id: docSnap.id, ...docSnap.data() };
        setProducto(prodData);
        setPalabraClave(prodData.titulo?.split(" ")[0] || "");
      }
      setLoading(false);
    };
    if (idProducto) cargarDetalle();
  }, [idProducto]);

  useEffect(() => {
    const buscarRelacionados = async () => {
      if (!palabraClave || !producto) {
        setRelacionados([]);
        return;
      }
      const snap = await getDocs(collection(db, "productos"));
      let otros = [];
      snap.forEach(d => {
        const data = d.data();
        if (
          d.id !== producto.id &&
          data.titulo &&
          data.titulo.toLowerCase().includes(palabraClave.toLowerCase())
        ) {
          otros.push({ id: d.id, ...data });
        }
      });
      // Si hay un producto anterior, lo ponemos primero en la lista y evitamos duplicados
      if (productoAnterior && otros.every(p => p.id !== productoAnterior.id)) {
        otros = [productoAnterior, ...otros];
      }
      setRelacionados(otros);
    };
    buscarRelacionados();
    // eslint-disable-next-line
  }, [palabraClave, producto, productoAnterior]);

  // Cambiar a un producto relacionado (actual pasa a anterior)
  const handleVerRelacionado = (prod) => {
    setProductoAnterior(producto);
    setProducto(prod);
    setPalabraClave(prod.titulo?.split(" ")[0] || "");
  };

  // Volver al listado (resetea productoAnterior)
  const handleVolver = () => {
    setProductoAnterior(null);
    onVolver();
  };

  if (loading) return <div className="text-center py-10">Cargando...</div>;
  if (!producto) return <div className="text-center py-10 text-red-600">Producto no encontrado</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white rounded-lg shadow-lg mt-8">
      <button
        className="mb-4 px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-800"
        onClick={handleVolver}
      >
        ← Volver
      </button>

      {/* FOTO Y TITULO DESTACADO */}
      <div className="flex flex-col md:flex-row gap-8 mb-6">
        <div className="flex-shrink-0 flex items-center justify-center">
          {producto.imagenUrl ? (
            <a
              href={producto.imagenUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Ver imagen original"
            >
              <img
                src={producto.imagenUrl}
                alt={producto.titulo}
                className="w-64 h-64 object-contain rounded-lg shadow border cursor-pointer"
              />
            </a>
          ) : (
            <img
              src={producto.imagenUrl}
              alt={producto.titulo}
              className="w-64 h-64 object-contain rounded-lg shadow border"
            />
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-2 text-blue-800">{producto.titulo}</h1>
          <p className="text-lg text-gray-700 mb-3">{producto.descripcion}</p>
          <div className="text-md text-green-700 font-semibold mb-1">
            Precio: ${producto.precio}
          </div>
          <div className="text-sm text-gray-600 mb-1">Cantidad: {producto.cantidad}</div>
          {producto.marcas?.length > 0 && (
            <div className="mb-1">
              <span className="font-semibold text-indigo-700">Marcas:</span>{" "}
              {producto.marcas.join(", ")}
            </div>
          )}
          {producto.categorias?.length > 0 && (
            <div>
              <span className="font-semibold text-green-700">Categorías:</span>{" "}
              {producto.categorias.join(", ")}
            </div>
          )}
        </div>
      </div>

      {/* INPUT DE BUSQUEDA DINAMICA */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-semibold text-blue-700" htmlFor="relacionados-busqueda">
          Buscar relacionados por palabra:
        </label>
        <input
          id="relacionados-busqueda"
          type="text"
          value={palabraClave}
          onChange={e => setPalabraClave(e.target.value)}
          className="border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="ej: freno"
        />
      </div>

      {/* PRODUCTOS RELACIONADOS */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-3 text-blue-700">
          Productos relacionados con "{palabraClave}"
        </h2>
        {relacionados.length === 0 ? (
          <div className="text-gray-500">No hay otros productos relacionados.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relacionados.map(prod => (
              <div
                key={prod.id}
                className="bg-slate-50 border rounded-lg p-4 flex gap-4 items-center cursor-pointer hover:bg-blue-50 transition"
                onClick={() => handleVerRelacionado(prod)}
                title="Ver detalle de este producto"
              >
                <img
                  src={prod.imagenUrl}
                  alt={prod.titulo}
                  className="w-20 h-20 object-contain rounded border"
                />
                <div>
                  <div className="font-semibold text-blue-800">{prod.titulo}</div>
                  <div className="text-xs text-gray-600 truncate max-w-xs">{prod.descripcion}</div>
                  <div className="text-sm text-green-700 font-semibold">Precio: ${prod.precio}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}