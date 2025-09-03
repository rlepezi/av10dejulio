import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, getDocs, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useImageUrl } from '../hooks/useImageUrl';

// --- HorarioDetalladoComponente ---
const diasSemana = [
  "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"
];

function HorarioDetallado({ horario, setHorario }) {
  function handleHorarioChange(idx, field, value) {
    setHorario(hor =>
      hor.map((h, i) =>
        i === idx ? { ...h, [field]: field === "abierto" ? value : value } : h
      )
    );
  }

  function handleHorarioAbierto(idx, checked) {
    if (
      checked &&
      idx > 0 &&
      horario[0].abierto &&
      horario[0].desde &&
      horario[0].hasta
    ) {
      const copiar = window.confirm(
        `¿Deseas copiar el horario de Lunes (${horario[0].desde} a ${horario[0].hasta}) a ${diasSemana[idx]}?`
      );
      setHorario(prev =>
        prev.map((h, i) => {
          if (i === idx) {
            if (copiar) {
              return {
                ...h,
                abierto: true,
                desde: horario[0].desde,
                hasta: horario[0].hasta
              };
            } else {
              return { ...h, abierto: true, desde: "", hasta: "" };
            }
          }
          return h;
        })
      );
    } else {
      setHorario(prev =>
        prev.map((h, i) => (i === idx ? { ...h, abierto: checked } : h))
      );
    }
  }

  return (
    <div className="mt-4">
      <label className="block font-semibold mb-1">Horario detallado:</label>
      <div className="grid grid-cols-1 gap-1">
        {horario.map((h, idx) => (
          <div key={h.dia} className="flex items-center gap-2">
            <label className="w-20">{h.dia}:</label>
            <input
              type="checkbox"
              checked={h.abierto}
              onChange={e => handleHorarioAbierto(idx, e.target.checked)}
            />
            <span className="text-xs">Abierto</span>
            <input
              type="time"
              disabled={!h.abierto}
              value={h.desde}
              onChange={e => handleHorarioChange(idx, "desde", e.target.value)}
              className="border p-1 rounded text-xs w-24"
              placeholder="Desde"
            />
            <span>-</span>
            <input
              type="time"
              disabled={!h.abierto}
              value={h.hasta}
              onChange={e => handleHorarioChange(idx, "hasta", e.target.value)}
              className="border p-1 rounded text-xs w-24"
              placeholder="Hasta"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// --- helpers ---
function formatRut(rut) {
  let clean = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return clean;
  let cuerpo = clean.slice(0, -1);
  let dv = clean.slice(-1);
  let formatted = "";
  while (cuerpo.length > 3) {
    formatted = "." + cuerpo.slice(-3) + formatted;
    cuerpo = cuerpo.slice(0, -3);
  }
  formatted = cuerpo + formatted;
  return formatted + "-" + dv;
}
function validarRut(rut) {
  let clean = rut.replace(/\./g, "").replace("-", "").toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false;
  let num = parseInt(clean.slice(0, -1), 10);
  if (isNaN(num) || num < 50000000) return false;
  let dv = clean.slice(-1);
  if (!/[0-9K]/.test(dv)) return false;
  return true;
}

// --- generar clave segura por defecto ---
function generarClaveSegura(longitud = 12) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*-_";
  let pass = "";
  for (let i = 0; i < longitud; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

const regiones = [
  "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", "Valparaíso",
  "Metropolitana", "O'Higgins", "Maule", "Ñuble", "Biobío", "La Araucanía",
  "Los Ríos", "Los Lagos", "Aysén", "Magallanes"
];

const estados = [
  "En revisión",
  "Activa"
];

const pasos = [
  "Empresa",
  "Marcas & Categorías",
  "Representante legal",
  "Validación y Usuario",
  "Condiciones"
];

export default function EditarProveedorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proveedor, setProveedor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState([]);

  // Validaciones documentales
  const [docsOk, setDocsOk] = useState(false);
  const [rutValidado, setRutValidado] = useState(false);
  const [documentosMailOk, setDocumentosMailOk] = useState(false);

  // Usuario para acceso proveedor
  const [usuarioEmail, setUsuarioEmail] = useState("");
  const [usuarioNombre, setUsuarioNombre] = useState("");
  const [usuarioClave, setUsuarioClave] = useState("");
  const [usuarioClaveVisible, setUsuarioClaveVisible] = useState(false);

  // Logo upload
  const [logoFile, setLogoFile] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // Hook para manejar la URL del logo
  const { imageUrl: logoUrl, loading: logoLoading, error: logoError } = useImageUrl(proveedor?.logo);

  // Horario detallado
  const [horario, setHorario] = useState(
    diasSemana.map(dia => ({
      dia,
      abierto: false,
      desde: "",
      hasta: ""
    }))
  );

  useEffect(() => {
    async function fetchProveedor() {
      const ref = doc(db, "empresas", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setProveedor({ id: snap.id, ...snap.data() });
        setDocsOk(!!snap.data().docsOk);
        setRutValidado(!!snap.data().rutValidado);
        setDocumentosMailOk(!!snap.data().documentosMailOk);

        // Horario inicial
        if (Array.isArray(snap.data().horarioDetallado) && snap.data().horarioDetallado.length === 7) {
          setHorario(snap.data().horarioDetallado);
        }
        // Usuario de acceso: por defecto los datos del representante
        const rep = snap.data().representante || {};
        setUsuarioEmail(snap.data().usuarioEmail || rep.email || "");
        setUsuarioNombre(snap.data().usuarioNombre || rep.nombre || "");
        setUsuarioClave(""); // visible sólo en UI, nunca persistente
      } else {
        setError("Proveedor no encontrado");
      }
      setLoading(false);
    }
    async function cargarCategoriasYMarcas() {
      const snapCats = await getDocs(collection(db, "categorias"));
      setCategoriasDisponibles(snapCats.docs.map(doc => doc.data().nombre));
      const snapMarcas = await getDocs(collection(db, "marcas"));
      setMarcasDisponibles(snapMarcas.docs.map(doc => doc.data().nombre));
    }
    fetchProveedor();
    cargarCategoriasYMarcas();
  }, [id]);

  // Si cambia el representante y usuario de acceso está vacío, sugerir
  useEffect(() => {
    if (
      proveedor &&
      proveedor.representante &&
      (!usuarioEmail || usuarioEmail === "") &&
      (!usuarioNombre || usuarioNombre === "")
    ) {
      setUsuarioEmail(proveedor.representante.email || "");
      setUsuarioNombre(proveedor.representante.nombre || "");
    }
  }, [proveedor]);

  // Al entrar al paso usuario, si clave está vacía, genera por defecto
  useEffect(() => {
    if (step === 3 && (!usuarioClave || usuarioClave.length < 8)) {
      setUsuarioClave(generarClaveSegura());
    }
    // eslint-disable-next-line
  }, [step]);

  function toggleCategoria(cat) {
    setProveedor(prov => ({
      ...prov,
      categorias: Array.isArray(prov.categorias)
        ? (prov.categorias.includes(cat)
            ? prov.categorias.filter(c => c !== cat)
            : [...prov.categorias, cat]
          )
        : [cat]
    }));
  }
  function toggleMarca(marca) {
    setProveedor(prov => ({
      ...prov,
      marcas: Array.isArray(prov.marcas)
        ? (prov.marcas.includes(marca)
            ? prov.marcas.filter(m => m !== marca)
            : [...prov.marcas, marca]
          )
        : [marca]
    }));
  }

  // Logo upload handler
  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogoUploading(true);
    setLogoFile(file);
    try {
      const storage = getStorage();
      const fileRef = ref(storage, `logos/${id}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setProveedor(prov => ({ ...prov, logo: url }));
    } catch (err) {
      setError("Error subiendo logo: " + err.message);
    }
    setLogoUploading(false);
    setLogoFile(null);
  }

  async function crearUsuarioProveedor(email, empresaId, nombre, clave) {
    const auth = getAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, clave);
      await setDoc(doc(db, "usuarios", userCredential.user.uid), {
        email,
        nombre,
        empresaId,
        rol: "proveedor",
        creadoPorAprobacion: true,
        debeCambiarClave: true,
      });
      window.alert(`¡Usuario proveedor creado exitosamente para ${email} con clave temporal!`);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        window.alert("El usuario ya existe en Firebase Auth.");
      } else {
        window.alert("Error al crear usuario: " + err.message);
      }
    }
  }

  // Validaciones por paso
  function handleNext(e) {
    e?.preventDefault();
    setError("");
    if (!proveedor) return;
    if (step === 0) {
      if (!proveedor.nombre || proveedor.nombre.trim().length < 3) {
        setError("Debes ingresar el nombre o razón social de la empresa.");
        return;
      }
      if (!proveedor.rut) {
        setError("Debes ingresar el RUT de la empresa.");
        return;
      }
      if (!validarRut(proveedor.rut)) {
        setError("El RUT debe ser mayor a 50 millones y tener formato 50.222.333-1 (último dígito numérico o K).");
        return;
      }
      if (!proveedor.email || !/\S+@\S+\.\S+/.test(proveedor.email)) {
        setError("Ingresa un correo electrónico válido.");
        return;
      }
      if (!proveedor.telefono || proveedor.telefono.length < 7) {
        setError("Ingresa un teléfono válido.");
        return;
      }
      if (!proveedor.direccion) {
        setError("Debes ingresar la dirección.");
        return;
      }
      if (!proveedor.ciudad) {
        setError("Debes ingresar la ciudad.");
        return;
      }
      if (!proveedor.region) {
        setError("Debes seleccionar la región.");
        return;
      }
    }
    if (step === 1) {
      if (!proveedor.categorias || proveedor.categorias.length === 0) {
        setError("Selecciona al menos una categoría.");
        return;
      }
      if (!proveedor.marcas || proveedor.marcas.length === 0) {
        setError("Selecciona al menos una marca.");
        return;
      }
    }
    if (step === 2) {
      if (
        !proveedor.representante?.nombre ||
        !proveedor.representante?.email ||
        !proveedor.representante?.telefono
      ) {
        setError("Completa todos los datos del representante.");
        return;
      }
      if (!/\S+@\S+\.\S+/.test(proveedor.representante.email)) {
        setError("El email del representante no es válido.");
        return;
      }
    }
    setStep(s => s + 1);
  }

  function handleBack() {
    setError("");
    setStep(s => s - 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!proveedor) return;

    // Si el estado es Activa, los documentos y usuario son obligatorios
    if (proveedor.estado === "Activa") {
      if (!docsOk || !rutValidado || !documentosMailOk) {
        setError("Para activar el proveedor, debes confirmar todas las validaciones documentales.");
        return;
      }
      if (
        !usuarioEmail ||
        !/\S+@\S+\.\S+/.test(usuarioEmail) ||
        !usuarioNombre ||
        usuarioNombre.length < 3 ||
        !usuarioClave ||
        usuarioClave.length < 6
      ) {
        setError("Para activar el proveedor, debes ingresar nombre, email y clave válida para el usuario de acceso.");
        return;
      }
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, "empresas", id), {
        nombre: proveedor.nombre ?? "",
        rut: proveedor.rut ?? "",
        email: proveedor.email ?? "",
        telefono: proveedor.telefono ?? "",
        direccion: proveedor.direccion ?? "",
        ciudad: proveedor.ciudad ?? "",
        region: proveedor.region ?? "",
        descripcion: proveedor.descripcion ?? "",
        categorias: proveedor.categorias || [],
        marcas: proveedor.marcas || [],
        web: proveedor.web ?? "",
        horarioDetallado: horario,
        logo: proveedor.logo ?? "",
        imagen: proveedor.imagen ?? "",
        estado: proveedor.estado,
        representante: {
          nombre: proveedor.representante?.nombre || "",
          email: proveedor.representante?.email || "",
          telefono: proveedor.representante?.telefono || "",
        },
        docsOk,
        rutValidado,
        documentosMailOk,
        usuarioEmail,
        usuarioNombre,
        origen: proveedor.origen ?? "",
        rol: proveedor.rol  ?? "",
      });

      // Si se pasa a "Activa", crea usuario con clave personalizada
      if (
        proveedor.estado === "Activa" &&
        usuarioEmail &&
        usuarioClave &&
        usuarioNombre
      ) {
        const confirmar = window.confirm(
          `¿Crear usuario con rol proveedor para el correo ${usuarioEmail} y clave "${usuarioClave}"?`
        );
        if (confirmar) {
          await crearUsuarioProveedor(usuarioEmail, id, usuarioNombre, usuarioClave);
        }
      }
      navigate("/admin/proveedores");
    } catch (err) {
      setError("Error al guardar cambios: " + err.message);
    }
    setSaving(false);
  }

  if (loading) return <div>Cargando proveedor...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-white">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-xl border border-blue-100">
        <div className="mb-6 flex items-center justify-center gap-3">
          {pasos.map((label, idx) => (
            <React.Fragment key={label}>
              <div className={`rounded-full w-7 h-7 flex items-center justify-center font-bold
                ${idx === step
                  ? 'bg-blue-700 text-white shadow'
                  : idx < step
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'}
              `}>
                {idx + 1}
              </div>
              {idx < pasos.length - 1 && <div className="w-8 h-1 rounded bg-blue-200" />}
            </React.Fragment>
          ))}
        </div>
        <div className="mb-2 text-center text-blue-900 font-semibold text-lg">{pasos[step]}</div>
        {error && <div className="text-red-500 mb-3 text-center">{error}</div>}
        <form onSubmit={step === pasos.length - 1 ? handleSubmit : handleNext} autoComplete="off">
          {step === 0 && (
            <>
              <h3 className="text-lg font-bold mb-3 text-blue-700">Empresa / Razón social</h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="nombre"
                  value={proveedor.nombre || ""}
                  onChange={e => setProveedor({ ...proveedor, nombre: e.target.value })}
                  className="col-span-2 border p-2 rounded"
                  placeholder="Nombre de la empresa o razón social *"
                  required
                />
                <input
                  name="rut"
                  value={proveedor.rut || ""}
                  onChange={e => {
                    let val = e.target.value.replace(/[^0-9kK\.-]/g, "");
                    if (val.replace(/[^0-9kK]/g, "").length >= 8) val = formatRut(val);
                    setProveedor({ ...proveedor, rut: val });
                  }}
                  className="border p-2 rounded"
                  placeholder="RUT (ej: 50.222.333-1) *"
                  maxLength={12}
                  required
                  autoComplete="off"
                  inputMode="text"
                />
                <input
                  name="web"
                  value={proveedor.web || ""}
                  onChange={e => setProveedor({ ...proveedor, web: e.target.value })}
                  className="border p-2 rounded"
                  placeholder="Sitio web (opcional)"
                />
                <input
                  name="email"
                  value={proveedor.email || ""}
                  onChange={e => setProveedor({ ...proveedor, email: e.target.value })}
                  className="border p-2 rounded"
                  placeholder="Correo empresa *"
                  type="email"
                  required
                />
                <input
                  name="telefono"
                  value={proveedor.telefono || ""}
                  onChange={e => setProveedor({ ...proveedor, telefono: e.target.value })}
                  className="border p-2 rounded"
                  placeholder="Teléfono *"
                  type="tel"
                  required
                />
                <input
                  name="direccion"
                  value={proveedor.direccion || ""}
                  onChange={e => setProveedor({ ...proveedor, direccion: e.target.value })}
                  className="col-span-2 border p-2 rounded"
                  placeholder="Dirección *"
                  required
                />
                <input
                  name="ciudad"
                  value={proveedor.ciudad || ""}
                  onChange={e => setProveedor({ ...proveedor, ciudad: e.target.value })}
                  className="border p-2 rounded"
                  placeholder="Ciudad *"
                  required
                />
                <select
                  name="region"
                  value={proveedor.region || ""}
                  onChange={e => setProveedor({ ...proveedor, region: e.target.value })}
                  className="border p-2 rounded"
                  required
                >
                  <option value="">Selecciona región *</option>
                  {regiones.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <textarea
                name="descripcion"
                value={proveedor.descripcion || ""}
                onChange={e => setProveedor({ ...proveedor, descripcion: e.target.value })}
                className="mt-2 w-full border p-2 rounded"
                placeholder="Breve descripción (opcional)"
                rows={2}
              />
              {/* Logo uploader */}
              <div className="mt-2">
                <label className="block font-semibold mb-1">Logo:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={logoUploading}
                  className="block"
                />
                {logoUploading && <span className="text-xs text-blue-700">Subiendo logo...</span>}
                {proveedor.logo && (
                  <div className="mt-2">
                                            {logoLoading ? (
                          <div className="h-16 w-16 bg-gray-200 rounded border flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin"></div>
                          </div>
                        ) : logoUrl ? (
                          <img src={logoUrl} alt="Logo empresa" className="h-16 rounded border" />
                        ) : (
                          <div className="h-16 w-16 bg-gray-200 rounded border flex items-center justify-center">
                            <span className="text-xs text-gray-500">Sin logo</span>
                          </div>
                        )}
                        {logoError && (
                          <span className="text-red-500 text-sm">Error: {logoError}</span>
                        )}
                    <div className="text-xs text-gray-500 break-all">{proveedor.logo}</div>
                  </div>
                )}
              </div>
              <input
                name="imagen"
                value={proveedor.imagen || ""}
                onChange={e => setProveedor({ ...proveedor, imagen: e.target.value })}
                className="mt-2 w-full border p-2 rounded"
                placeholder="Imagen (ej: imagen_empresa.png)"
              />
              {/* Horario detallado */}
              <HorarioDetallado horario={horario} setHorario={setHorario} />
            </>
          )}

          {step === 1 && (
            <>
              <h3 className="text-lg font-bold mb-2 text-blue-700">Marcas y categorías</h3>
              <div className="mb-4">
                <label className="block font-semibold mb-1 text-gray-700">Marcas asociadas *</label>
                <div className="flex flex-wrap gap-2">
                  {marcasDisponibles.map((marca, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => toggleMarca(marca)}
                      className={`px-3 py-1 rounded-full border text-sm transition
                        ${proveedor.marcas && proveedor.marcas.includes(marca)
                          ? "bg-indigo-600 text-white border-indigo-700 shadow"
                          : "bg-gray-100 text-gray-700 hover:bg-indigo-50"}
                      `}
                    >
                      {marca}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1 text-gray-700">Categorías asociadas *</label>
                <div className="flex flex-wrap gap-2">
                  {categoriasDisponibles.map((cat, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => toggleCategoria(cat)}
                      className={`px-3 py-1 rounded-full border text-sm transition
                        ${proveedor.categorias && proveedor.categorias.includes(cat)
                          ? "bg-green-600 text-white border-green-700 shadow"
                          : "bg-green-100 text-green-800 hover:bg-green-50"}
                      `}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="text-lg font-bold mb-3 text-blue-700">Datos del representante legal</h3>
              <div className="grid grid-cols-1 gap-2">
                <input
                  name="representante_nombre"
                  value={proveedor.representante?.nombre || ""}
                  onChange={e => setProveedor({ ...proveedor, representante: { ...proveedor.representante, nombre: e.target.value } })}
                  className="border p-2 rounded"
                  placeholder="Nombre representante *"
                  required
                />
                <input
                  name="representante_email"
                  value={proveedor.representante?.email || ""}
                  onChange={e => setProveedor({ ...proveedor, representante: { ...proveedor.representante, email: e.target.value } })}
                  className="border p-2 rounded"
                  placeholder="Email representante *"
                  type="email"
                  required
                />
                <input
                  name="representante_telefono"
                  value={proveedor.representante?.telefono || ""}
                  onChange={e => setProveedor({ ...proveedor, representante: { ...proveedor.representante, telefono: e.target.value } })}
                  className="border p-2 rounded"
                  placeholder="Teléfono representante *"
                  required
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="text-lg font-bold mb-3 text-blue-700">Validación documental y usuario de acceso</h3>
              <div className="flex flex-col gap-2 mb-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={docsOk} onChange={e => setDocsOk(e.target.checked)} />
                  Se recibieron los documentos que acreditan que es empresa.
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={rutValidado} onChange={e => setRutValidado(e.target.checked)} />
                  Se validó el RUT de la empresa.
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={documentosMailOk} onChange={e => setDocumentosMailOk(e.target.checked)} />
                  Llegaron los documentos solicitados en el mail.
                </label>
              </div>
              {(docsOk || rutValidado || documentosMailOk) && (
                <>
                  <div className="border-t pt-4 mt-2 mb-2" />
                  <div className="font-bold text-blue-700 mb-2">Usuario de acceso</div>
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      name="usuario_nombre"
                      value={usuarioNombre}
                      onChange={e => setUsuarioNombre(e.target.value)}
                      className="border p-2 rounded"
                      placeholder="Nombre del usuario *"
                      required={docsOk || rutValidado || documentosMailOk}
                    />
                    <input
                      name="usuario_email"
                      value={usuarioEmail}
                      onChange={e => setUsuarioEmail(e.target.value)}
                      className="border p-2 rounded"
                      placeholder="Correo electrónico *"
                      type="email"
                      required={docsOk || rutValidado || documentosMailOk}
                    />
                    <div className="flex gap-2 items-center">
                      <input
                        name="usuario_clave"
                        value={usuarioClave}
                        onChange={e => setUsuarioClave(e.target.value)}
                        className="border p-2 rounded flex-1"
                        placeholder="Clave inicial *"
                        type={usuarioClaveVisible ? "text" : "password"}
                        required={docsOk || rutValidado || documentosMailOk}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="text-xs border rounded px-2 py-1"
                        onClick={() => setUsuarioClaveVisible(v => !v)}
                        tabIndex={-1}
                      >
                        {usuarioClaveVisible ? "Ocultar" : "Mostrar"}
                      </button>
                      <button
                        type="button"
                        className="text-xs border rounded px-2 py-1"
                        onClick={() => setUsuarioClave(generarClaveSegura())}
                      >
                        Generar segura
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      El usuario deberá cambiar la clave al primer inicio de sesión.
                    </div>
                  </div>
                </>
              )}
              <div className="mt-4 bg-yellow-50 p-2 rounded text-yellow-700 text-xs">
                Para dejar como <b>Activa</b> el proveedor debes tener toda la validación y usuario de acceso ingresados.
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h3 className="text-lg font-bold mb-3 text-blue-700">Estado y Guardado</h3>
              <div className="mb-2">
                <label className="block font-semibold">Estado:</label>
                <select
                  className="w-full border px-2 py-1 rounded"
                  value={proveedor.estado || "En revisión"}
                  onChange={e => setProveedor({ ...proveedor, estado: e.target.value })}
                >
                  {estados.map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
              <div className="mt-2 mb-2 text-blue-700 text-sm">
                Para ACTIVAR el proveedor, debe estar todo validado y cambiar estado a <b>Activa</b>.
              </div>
            </>
          )}

          <div className="flex justify-between mt-6 gap-2">
            {step > 0 && (
              <button type="button" className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300" onClick={handleBack}>
                Atrás
              </button>
            )}
            <div className="flex-grow" />
            {step < pasos.length - 1 ? (
              <button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800 shadow transition">
                Siguiente
              </button>
            ) : (
              <button type="submit" className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800 shadow transition" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}