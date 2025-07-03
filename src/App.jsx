import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardSwitch from "./components/DashboardSwitch";

// Componentes principales
import FormNuevaMarca from "./components/FormNuevaMarca";
import FormNuevaCategoria from "./components/FormNuevaCategoria";
import AuthProvider from "./components/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import EditarProveedorForm from "./components/EditarProveedorForm";
import ListadoProveedoresAdmin from "./components/ListadoProveedoresAdmin";
import ListadoProductosAdmin from "./components/ListadoProductosAdmin";
import EditarCampañaForm from "./components/EditarCampañaForm";
import AdminNuevaCampaña from "./pages/AdminNuevaCampaña";
import EditarMarcaForm from "./components/EditarMarcaForm";
import EditarCategoriaForm from "./components/EditarCategoriaForm";
import ListadoMarcasAdmin from "./components/ListadoMarcasAdmin";
import ListadoCategoriasAdmin from "./components/ListadoCategoriasAdmin";
import LoginPage from "./components/LoginPage";
import PostularEmpresaPage from "./components/PostularEmpresaPage";
import ListadoCampañasAdmin from "./components/ListadoCampañasAdmin";
import SolicitudCampanaPage from "./components/SolicitudCampanaPage";
import SolicitudProductoPage from "./components/SolicitudProductoPage";
import ListadoSolicitudesCampanas from "./components/ListadoSolicitudesCampanas";
import ListadoSolicitudesProductos from "./components/ListadoSolicitudesProductos";
import MiEmpresaPage from "./components/MiEmpresaPage";
import EditarCampanaPage from "./components/EditarCampanaPage";
import EditarProductoPage from "./components/EditarProductoPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import MasInformacionProveedorPage from "./pages/MasInformacionProveedorPage";
import ProveedorDashboardPage from "./pages/ProveedorDashboardPage";
import DashboardAdmin from "./components/DashboardAdmin";
import DashboardProveedor from "./components/DashboardProveedor";

// Componentes visuales del home clásico
import FormNuevaEmpresa from "./components/FormNuevaEmpresa";
import FormNuevaCampana from "./components/FormNuevaCampana";
import FormNuevoProducto from "./components/FormNuevoProducto";
import ListadoEmpresas from "./components/ListadoEmpresas";
import ListadoCampanas from "./components/ListadoCampanas";
import ListadoMarcas from "./components/ListadoMarcas";
import ListadoProductos from "./components/ListadoProductos";
import DetalleProducto from "./components/DetalleProducto";
import Header from "./components/Header";
import DetalleCampana from "./components/DetalleCampana";
import HeaderMenu from "./components/HeaderMenu";

function BotonVolver({ setEmpresaAEditar, setCampanaAEditar, setView, setIdCampanaDetalle, setIdProductoDetalle }) {
  return (
    <button
      className="mb-6 bg-blue-600 hover:bg-blue-800 text-white px-4 py-2 rounded-full shadow transition"
      onClick={() => {
        setEmpresaAEditar && setEmpresaAEditar(null);
        setCampanaAEditar && setCampanaAEditar(null);
        setView && setView("");
        setIdCampanaDetalle && setIdCampanaDetalle(null);
        setIdProductoDetalle && setIdProductoDetalle(null);
      }}
    >
      ← Volver
    </button>
  );
}

export default function App() {
  // Estados para el home clásico
  const [view, setView] = useState(""); // "" = principal
  const [busqueda, setBusqueda] = useState("");
  const [marcaSeleccionada, setMarcaSeleccionada] = useState(null);
  const [empresaAEditar, setEmpresaAEditar] = useState(null);
  const [campanaAEditar, setCampanaAEditar] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [productoDetalle, setProductoDetalle] = useState(null);
  const [idCampanaDetalle, setIdCampanaDetalle] = useState(null);
  const [idProductoDetalle, setIdProductoDetalle] = useState(null);

  // Firestore: empresas y categorías
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "empresas"), snap => {
      setEmpresas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "empresas"), (snapshot) => {
      const allCats = [];
      snapshot.forEach(doc => {
        const empresa = doc.data();
        if (Array.isArray(empresa.categorias)) {
          allCats.push(...empresa.categorias);
        }
      });
      setCategoriasDisponibles([...new Set(allCats)].sort());
    });
    return () => unsubscribe();
  }, []);

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
    });
    return () => unsubscribe();
  }, []);

  if (empresaAEditar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-200 via-blue-100 to-green-100 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white/90 rounded-lg p-8 shadow-lg">
          <BotonVolver
            setEmpresaAEditar={setEmpresaAEditar}
            setCampanaAEditar={setCampanaAEditar}
            setView={setView}
            setIdCampanaDetalle={setIdCampanaDetalle}
            setIdProductoDetalle={setIdProductoDetalle}
          />
          <FormNuevaEmpresa empresaEdit={empresaAEditar} onFinish={() => setEmpresaAEditar(null)} />
        </div>
      </div>
    );
  }
  if (campanaAEditar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-200 via-blue-100 to-green-100 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white/90 rounded-lg p-8 shadow-lg">
          <BotonVolver
            setEmpresaAEditar={setEmpresaAEditar}
            setCampanaAEditar={setCampanaAEditar}
            setView={setView}
            setIdCampanaDetalle={setIdCampanaDetalle}
            setIdProductoDetalle={setIdProductoDetalle}
          />
          <FormNuevaCampana campanaEdit={campanaAEditar} onFinish={() => setCampanaAEditar(null)} />
        </div>
      </div>
    );
  }
  if (view === "empresa") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-200 via-blue-100 to-green-100 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white/90 rounded-lg p-8 shadow-lg">
          <BotonVolver
            setEmpresaAEditar={setEmpresaAEditar}
            setCampanaAEditar={setCampanaAEditar}
            setView={setView}
            setIdCampanaDetalle={setIdCampanaDetalle}
            setIdProductoDetalle={setIdProductoDetalle}
          />
          <FormNuevaEmpresa />
        </div>
      </div>
    );
  }
  if (view === "campana") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-200 via-blue-100 to-green-100 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white/90 rounded-lg p-8 shadow-lg">
          <BotonVolver
            setEmpresaAEditar={setEmpresaAEditar}
            setCampanaAEditar={setCampanaAEditar}
            setView={setView}
            setIdCampanaDetalle={setIdCampanaDetalle}
            setIdProductoDetalle={setIdProductoDetalle}
          />
          <FormNuevaCampana />
        </div>
      </div>
    );
  }
  if (view === "producto") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-200 via-blue-100 to-green-100 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white/90 rounded-lg p-8 shadow-lg">
          <BotonVolver
            setEmpresaAEditar={setEmpresaAEditar}
            setCampanaAEditar={setCampanaAEditar}
            setView={setView}
            setIdCampanaDetalle={setIdCampanaDetalle}
            setIdProductoDetalle={setIdProductoDetalle}
          />
          <FormNuevoProducto onFinish={() => setView("")} />
        </div>
      </div>
    );
  }
  if (productoDetalle) {
    return (
      <DetalleProducto idProducto={productoDetalle} onVolver={() => setProductoDetalle(null)} />
    );
  }
  if (idCampanaDetalle) {
    return (
      <DetalleCampana
        idCampana={idCampanaDetalle}
        onVolver={() => setIdCampanaDetalle(null)}
        onVerOtra={setIdCampanaDetalle}
      />
    );
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <HeaderMenu />
        <Routes>
          {/* Login y postulación */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/proveedores" element={<DashboardProveedor />} />
          <Route path="/postular-empresa" element={<PostularEmpresaPage />} />

          {/* Dashboard con redirección automática según rol */}
          <Route path="/dashboard" element={<DashboardSwitch />} />

          {/* Dashboards específicos */}
          <Route path="/dashboard/proveedor" element={<ProveedorDashboardPage />} />
          <Route path="/admin" element={<ProtectedRoute rol="admin"><AdminDashboardPage /></ProtectedRoute>} />

          {/* Panel ADMIN */}
          <Route path="/admin/marcas" element={<ProtectedRoute rol="admin"><ListadoMarcasAdmin /></ProtectedRoute>} />
          <Route path="/admin/categorias" element={<ProtectedRoute rol="admin"><ListadoCategoriasAdmin /></ProtectedRoute>} />
          <Route path="/admin/proveedores" element={<ProtectedRoute rol="admin"><ListadoProveedoresAdmin /></ProtectedRoute>} />
          <Route path="/admin/proveedores/nuevo-proveedor" element={<ProtectedRoute rol="admin"><FormNuevaEmpresa /></ProtectedRoute>} />
          <Route path="/admin/editar-empresa/:id" element={<EditarProveedorForm />} />
          <Route path="/admin/editar-campana/:id" element={<ProtectedRoute rol="admin"><EditarCampanaPage /></ProtectedRoute>} />
          <Route path="/admin/campañas/:id/editar-campaña" element={<EditarCampanaPage />} />
          <Route path="/admin/editar-producto/:id" element={<ProtectedRoute rol="admin"><EditarProductoPage /></ProtectedRoute>} />
          <Route path="/admin/campañas" element={<ProtectedRoute rol="admin"><ListadoCampañasAdmin /></ProtectedRoute>} />
          <Route path="/admin/productos" element={<ProtectedRoute rol="admin"><ListadoProductosAdmin /></ProtectedRoute>} />
          <Route path="/admin/campañas/nueva" element={<ProtectedRoute rol="admin"><AdminNuevaCampaña/></ProtectedRoute>} />
          <Route path="/admin/nuevo-producto" element={<ProtectedRoute rol="admin"><FormNuevoProducto /></ProtectedRoute>} />
          <Route path="/admin/marcas/nueva-marca" element={<ProtectedRoute rol="admin"><FormNuevaMarca/></ProtectedRoute>} />
          <Route path="/admin/categorias/nueva-categoria" element={<ProtectedRoute rol="admin"><FormNuevaCategoria /></ProtectedRoute>} />
          
          <Route path="/admin/solicitudes-productos" element={<ProtectedRoute rol="admin"><ListadoSolicitudesProductos /></ProtectedRoute>} />
         

          {/* Panel Proveedor */}
          <Route path="/proveedores/mas-informacion" element={<MasInformacionProveedorPage />} />
          <Route path="/proveedores/solicitar-campana" element={<ProtectedRoute rol="proveedor"><SolicitudCampanaPage /></ProtectedRoute>} />
          <Route path="/proveedores/solicitar-producto" element={<ProtectedRoute rol="proveedor"><SolicitudProductoPage /></ProtectedRoute>} />
          <Route path="/proveedores/mi-empresa" element={<ProtectedRoute rol="proveedor"><MiEmpresaPage /></ProtectedRoute>} />

          {/* Home clásico: landing, catálogos, etc */}
          <Route path="/" element={
            <div className="min-h-screen bg-gradient-to-br from-purple-200 via-blue-100 to-green-100">
              <div className="w-full mx-auto shadow-lg bg-white/80 rounded-lg p-8 my-10">
                <Header
                  onLogin={() => { /* tu función de login */ }}
                  onSelect={setView}
                  busqueda={busqueda}
                  setBusqueda={setBusqueda}
                />
                <ListadoMarcas onSelectMarca={setMarcaSeleccionada} />
                <div className="my-6"></div>
                {categoriasDisponibles.length > 0 && (
  <div className="mb-4 flex flex-wrap gap-2">
    <span className="text-green-700 font-medium">Filtrar por categoría:</span>
    {categoriasDisponibles.map(cat => {
      // Normaliza el nombre: minúsculas y sin espacios para el nombre del archivo
      const iconSrc = `/logos/${cat.toLowerCase().replace(/\s+/g, "")}.png`;
      return (
        <button
          key={cat}
          className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${
            categoriaSeleccionada === cat
              ? "bg-green-600 text-white"
              : "bg-green-100 text-green-800"
          }`}
          onClick={() => setCategoriaSeleccionada(cat)}
        >
          <img
            src={iconSrc}
            alt={cat}
            className="w-5 h-5 rounded-full bg-white object-contain border border-gray-200 mr-1"
            loading="lazy"
            onError={e => (e.target.style.display = "none")}
          />
          {cat}
        </button>
      );
    })}
    {categoriaSeleccionada && (
      <button
        onClick={() => setCategoriaSeleccionada(null)}
        className="px-2 py-1 rounded bg-gray-300 text-xs text-gray-900 ml-2"
      >
        Limpiar filtro
      </button>
    )}
  </div>
)}
                <ListadoCampanas 
                  filtroMarca={marcaSeleccionada} 
                  filtroBusqueda={busqueda}
                  onEditar={setCampanaAEditar}
                  usuario={usuario}
                  onVerDetalle={setIdCampanaDetalle}
                />
                {marcaSeleccionada && (
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-fuchsia-700 font-medium">
                      Mostrando empresas que venden <span className="underline">{marcaSeleccionada}</span>
                    </span>
                    <button
                      onClick={() => setMarcaSeleccionada(null)}
                      className="text-xs bg-fuchsia-300 hover:bg-fuchsia-500 text-white px-2 py-1 rounded transition"
                    >
                      Limpiar filtro
                    </button>
                  </div>
                )}
                <ListadoProductos
                  filtroMarca={marcaSeleccionada}
                  filtroCategoria={categoriaSeleccionada}
                  filtroBusqueda={busqueda}
                  empresas={empresas}
                  onVerDetalle={setProductoDetalle}
                />
                <ListadoEmpresas
                  filtroMarca={marcaSeleccionada}
                  filtroBusqueda={busqueda}
                  filtroCategoria={categoriaSeleccionada}
                  onEditar={setEmpresaAEditar}
                  usuario={usuario}
                />
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}