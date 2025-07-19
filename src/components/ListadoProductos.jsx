import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FaTags } from "react-icons/fa";
import ProductCard from "./ProductCard";

export default function ListadoProductos({
  filtroMarca,
  filtroCategoria,
  filtroBusqueda,
  empresas,
  onVerDetalle,
  onEditar,
}) {
  const [productos, setProductos] = useState([]);
  const [empresasMap, setEmpresasMap] = useState({});
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (empresas && empresas.length) {
      const map = {};
      empresas.forEach(e => {
        map[e.id] = {
          nombre: e.nombre,
          logoUrl: e.logoUrl || e.logo || null,
        };
      });
      setEmpresasMap(map);
    }
  }, [empresas]);

  useEffect(() => {
    const q = collection(db, "productos");
    const unsub = onSnapshot(q, (snap) => {
      let arr = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filtrar solo los productos "Activos"
      arr = arr.filter(p => (p.estado && p.estado.toLowerCase() === "activo"));

      if (filtroMarca) {
        arr = arr.filter(
          p => Array.isArray(p.marcas) && p.marcas.includes(filtroMarca)
        );
      }
      if (filtroCategoria) {
        arr = arr.filter(
          p => Array.isArray(p.categorias) && p.categorias.includes(filtroCategoria)
        );
      }
      if (filtroBusqueda && filtroBusqueda.trim()) {
        const term = filtroBusqueda.trim().toLowerCase();
        arr = arr.filter(
          p =>
            ((p.nombre && p.nombre.toLowerCase().includes(term)) ||
              (p.titulo && p.titulo.toLowerCase().includes(term))) ||
            (Array.isArray(p.marcas) &&
              p.marcas.some(m => m.toLowerCase().includes(term))) ||
            (Array.isArray(p.categorias) &&
              p.categorias.some(c => c.toLowerCase().includes(term)))
        );
      }

      setProductos(arr);
    });
    return () => unsub();
  }, [filtroMarca, filtroCategoria, filtroBusqueda]);

  const handleViewDetail = (productId) => {
    if (onVerDetalle) {
      onVerDetalle(productId);
    } else {
      navigate(`/producto/${productId}`);
    }
  };

  const handleAddToFavorites = (productId) => {
    setFavorites(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const transformProductData = (producto) => {
    const empresa = empresasMap[producto.idEmpresa] || {};
    
    // Función para parsear precio de manera segura
    const parsePrice = (price) => {
      if (!price) return null;
      if (typeof price === 'number') return price;
      if (typeof price === 'string') {
        const cleanPrice = price.replace(/[^0-9.-]+/g, "");
        return cleanPrice ? parseFloat(cleanPrice) : null;
      }
      return null;
    };

    // Función para parsear cantidad/stock de manera segura
    const parseStock = (cantidad) => {
      if (!cantidad) return Math.floor(Math.random() * 100) + 1;
      if (typeof cantidad === 'number') return cantidad;
      if (typeof cantidad === 'string') {
        const cleanStock = parseInt(cantidad);
        return isNaN(cleanStock) ? Math.floor(Math.random() * 100) + 1 : cleanStock;
      }
      return Math.floor(Math.random() * 100) + 1;
    };
    
    return {
      ...producto,
      imagenes: producto.imagenes || (producto.imagenUrl ? [producto.imagenUrl] : []),
      empresa: {
        nombre: empresa.nombre || producto.idEmpresa,
        logo: empresa.logoUrl,
        verified: true, // Asumimos que están verificados
        rating: 4.5, // Rating por defecto
      },
      rating: producto.calificacion ? parseFloat(producto.calificacion) : null,
      reviewCount: producto.numeroReseñas || Math.floor(Math.random() * 50) + 5,
      stock: parseStock(producto.cantidad),
      precio: parsePrice(producto.precio),
    };
  };

  if (!productos.length) {
    return (
      <div className="text-center text-gray-500 my-8">
        <FaTags className="inline mb-1" /> No hay productos para mostrar
      </div>
    );
  }

  return (
    <section className="mt-8">
      <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-blue-700">
        <FaTags className="text-blue-600" /> Productos
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {productos.map(producto => {
          const transformedProduct = transformProductData(producto);
          
          return (
            <ProductCard
              key={producto.id}
              product={transformedProduct}
              onViewDetail={handleViewDetail}
              onAddToFavorites={handleAddToFavorites}
              isFavorite={favorites.includes(producto.id)}
              showProviderInfo={true}
            />
          );
        })}
      </div>
    </section>
  );
}