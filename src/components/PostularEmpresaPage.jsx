import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const regiones = [
  "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", "Valparaíso",
  "Metropolitana", "O'Higgins", "Maule", "Ñuble", "Biobío", "La Araucanía",
  "Los Ríos", "Los Lagos", "Aysén", "Magallanes"
];

const steps = [
  "Empresa",
  "Marcas & Categorías",
  "Representante legal",
  "Condiciones"
];

// Helper para formatear RUT al vuelo
function formatRut(rut) {
  // Elimina puntos y guion previos
  let clean = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return clean;
  let cuerpo = clean.slice(0, -1);
  let dv = clean.slice(-1);
  let formatted = "";
  // Agregar puntos cada 3 dígitos desde el final
  while (cuerpo.length > 3) {
    formatted = "." + cuerpo.slice(-3) + formatted;
    cuerpo = cuerpo.slice(0, -3);
  }
  formatted = cuerpo + formatted;
  return formatted + "-" + dv;
}

// Valida si el rut es mayor a 50 millones y formato correcto
function validarRut(rut) {
  // Quitar puntos y guion
  let clean = rut.replace(/\./g, "").replace("-", "").toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false;
  let num = parseInt(clean.slice(0, -1), 10);
  if (isNaN(num) || num < 50000000) return false;
  // DV puede ser 0-9 o K
  let dv = clean.slice(-1);
  if (!/[0-9K]/.test(dv)) return false;
  return true;
}

export default function PostularEmpresaPage() {
  const [data, setData] = useState({
    nombre: "",
    rut: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    region: "",
    descripcion: "",
    categorias: [],
    marcas: [],
    web: "",
    representante_nombre: "",
    representante_email: "",
    representante_telefono: "",
  });
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");
  const [aceptaCondiciones, setAceptaCondiciones] = useState(false);
  const [condicionesError, setCondicionesError] = useState("");
  const [step, setStep] = useState(0);

  // Para ayuda web
  const [deseaInfoWeb, setDeseaInfoWeb] = useState(false);
  const [mostrarAvisoWeb, setMostrarAvisoWeb] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    async function cargarCategorias() {
      const snap = await getDocs(collection(db, "categorias"));
      setCategoriasDisponibles(snap.docs.map(doc => doc.data().nombre));
    }
    async function cargarMarcas() {
      const snap = await getDocs(collection(db, "marcas"));
      setMarcasDisponibles(snap.docs.map(doc => doc.data().nombre));
    }
    cargarCategorias();
    cargarMarcas();
  }, []);

  function toggleSeleccion(arr, value, setter) {
    setter(d => ({
      ...d,
      [arr]: d[arr].includes(value)
        ? d[arr].filter(x => x !== value)
        : [...d[arr], value]
    }));
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (name === "deseaInfoWeb") {
      setDeseaInfoWeb(checked);
      setMostrarAvisoWeb(checked);
    } else if (name === "rut") {
      // Permite solo números, puntos, K/k y guion
      let val = value.replace(/[^0-9kK\.-]/g, "");
      // Cuando llega a 9 caracteres o más, formatea automáticamente
      if (val.replace(/[^0-9kK]/g, "").length >= 8) {
        val = formatRut(val);
      }
      setData(d => ({ ...d, rut: val }));
    } else {
      setData(d => ({ ...d, [name]: value }));
    }
  }

  function handleNext(e) {
    e?.preventDefault();
    setError("");
    setCondicionesError("");
    // Validaciones por paso
    if (step === 0) {
      if (!data.nombre || data.nombre.trim().length < 3) {
        setError("Debes ingresar el nombre o razón social de la empresa.");
        return;
      }
      if (!data.rut) {
        setError("Debes ingresar el RUT de la empresa.");
        return;
      }
      if (!validarRut(data.rut)) {
        setError("El RUT debe ser mayor a 50 millones y tener formato 50.222.333-1 (último dígito numérico o K).");
        return;
      }
      if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
        setError("Ingresa un correo electrónico válido.");
        return;
      }
      if (!data.telefono || data.telefono.length < 7) {
        setError("Ingresa un teléfono válido.");
        return;
      }
      if (!data.direccion) {
        setError("Debes ingresar la dirección.");
        return;
      }
      if (!data.ciudad) {
        setError("Debes ingresar la ciudad.");
        return;
      }
      if (!data.region) {
        setError("Debes seleccionar la región.");
        return;
      }
      // web es opcional
    }
    if (step === 1) {
      if (data.categorias.length === 0 || data.marcas.length === 0) {
        setError("Selecciona al menos una marca y una categoría.");
        return;
      }
    }
    if (step === 2) {
      if (!data.representante_nombre || !data.representante_email || !data.representante_telefono) {
        setError("Completa todos los datos del representante.");
        return;
      }
      if (!/\S+@\S+\.\S+/.test(data.representante_email)) {
        setError("El email del representante no es válido.");
        return;
      }
    }
    setStep(s => s + 1);
  }

  function handleBack() {
    setError("");
    setCondicionesError("");
    setStep(s => s - 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setCondicionesError("");
    setError("");
    setExito(false);

    if (!aceptaCondiciones) {
      setCondicionesError("Debes aceptar las condiciones para continuar.");
      return;
    }

    setEnviando(true);
    try {
      await addDoc(collection(db, "empresas"), {
        nombre: data.nombre,
        rut: data.rut,
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion,
        ciudad: data.ciudad,
        region: data.region,
        descripcion: data.descripcion,
        categorias: data.categorias,
        marcas: data.marcas,
        web: data.web || null,
        solicitaInfoWeb: deseaInfoWeb,
        estado: "Enviado",
        fecha_postulacion: serverTimestamp(),
        representante: {
          nombre: data.representante_nombre,
          email: data.representante_email,
          telefono: data.representante_telefono
        },
        origen: "solicitud"
      });

      setExito(true);
      setData({
        nombre: "",
        rut: "",
        email: "",
        telefono: "",
        direccion: "",
        ciudad: "",
        region: "",
        descripcion: "",
        categorias: [],
        marcas: [],
        web: "",
        representante_nombre: "",
        representante_email: "",
        representante_telefono: "",
      });
      setAceptaCondiciones(false);
      setDeseaInfoWeb(false);
      setMostrarAvisoWeb(false);

      setTimeout(() => {
        navigate("/proveedores");
      }, 4000);
    } catch (err) {
      setError("Error al enviar la solicitud. Intenta de nuevo.");
    }
    setEnviando(false);
  }

  if (exito) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md border border-green-200">
          <h2 className="text-3xl font-bold text-green-800 mb-3">¡Solicitud enviada!</h2>
          <p className="mb-4 text-green-700">
            Hemos recibido tu postulación y nos pondremos en contacto contigo pronto.<br />
            El encargado te solicitará los documentos legales necesarios para acreditar la información de tu empresa.<br/>
            <span className="block mt-2 text-gray-600">Revisa tu correo electrónico para recibir los términos y condiciones.</span>
          </p>
          {deseaInfoWeb && (
            <div className="mt-6 border-t pt-4 text-blue-800 text-sm bg-blue-50 rounded">
              <b>¿No tienes página web aún?</b><br />
              Recibimos tu solicitud de información para la creación de tu página web.<br />
              Puedes contactarnos directamente en <a href="mailto:contacto@dbandurria.cl" className="underline text-green-700">contacto@dbandurria.cl</a> o visitar <a href="https://dbandurria.cl" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-blue-900">dbandurria.cl</a> para conocer más.<br/>
              Pronto un asesor de Digital Bandurria SPA se pondrá en contacto contigo.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-white">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-xl border border-blue-100">
        <div className="mb-6 flex items-center justify-center gap-3">
          {steps.map((label, idx) => (
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
              {idx < steps.length - 1 && <div className="w-8 h-1 rounded bg-blue-200" />}
            </React.Fragment>
          ))}
        </div>
        <div className="mb-2 text-center text-blue-900 font-semibold text-lg">{steps[step]}</div>
        {error && <div className="text-red-500 mb-3 text-center">{error}</div>}

        <form onSubmit={step === steps.length - 1 ? handleSubmit : handleNext} autoComplete="off">
          {step === 0 && (
            <>
              <h3 className="text-lg font-bold mb-3 text-blue-700">Nombre de la empresa o razón social</h3>
              <div className="grid grid-cols-2 gap-2">
                <input name="nombre" value={data.nombre} onChange={handleChange} className="col-span-2 border p-2 rounded" placeholder="Nombre de la empresa o razón social *" required />
                <input
                  name="rut"
                  value={data.rut}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  placeholder="RUT (ej: 50.222.333-1) *"
                  maxLength={12}
                  required
                  autoComplete="off"
                  inputMode="text"
                />
                <input name="web" value={data.web} onChange={handleChange} className="border p-2 rounded" placeholder="Sitio web (opcional)" />
                <input name="email" value={data.email} onChange={handleChange} className="border p-2 rounded" placeholder="Correo empresa *" type="email" required />
                <input name="telefono" value={data.telefono} onChange={handleChange} className="border p-2 rounded" placeholder="Teléfono *" type="tel" required />
                <input name="direccion" value={data.direccion} onChange={handleChange} className="col-span-2 border p-2 rounded" placeholder="Dirección *" required />
                <input name="ciudad" value={data.ciudad} onChange={handleChange} className="border p-2 rounded" placeholder="Ciudad *" required />
                <select name="region" value={data.region} onChange={handleChange} className="border p-2 rounded" required>
                  <option value="">Selecciona región *</option>
                  {regiones.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <textarea name="descripcion" value={data.descripcion} onChange={handleChange}
                className="mt-2 w-full border p-2 rounded" placeholder="Breve descripción (opcional)" rows={2} />
              {/* Nuevo: Checkbox para solicitar info web */}
              <div className="col-span-2 flex items-start gap-2 mt-4">
                <input
                  type="checkbox"
                  id="deseaInfoWeb"
                  name="deseaInfoWeb"
                  checked={deseaInfoWeb}
                  onChange={handleChange}
                  className="mt-1"
                />
                <label htmlFor="deseaInfoWeb" className="text-sm text-blue-800">
                  ¿Te interesa recibir información sobre cómo crear la página web de tu empresa?
                  <span className="block text-xs text-blue-600 mt-1">
                    Servicio ofrecido por <a href="https://dbandurria.cl" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Digital Bandurria SPA</a>
                  </span>
                </label>
              </div>
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
                      onClick={() => toggleSeleccion("marcas", marca, setData)}
                      className={`px-3 py-1 rounded-full border text-sm transition
                        ${data.marcas.includes(marca)
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
                      onClick={() => toggleSeleccion("categorias", cat, setData)}
                      className={`px-3 py-1 rounded-full border text-sm transition
                        ${data.categorias.includes(cat)
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
                <input name="representante_nombre" value={data.representante_nombre} onChange={handleChange} className="border p-2 rounded" placeholder="Nombre representante *" required />
                <input name="representante_email" value={data.representante_email} onChange={handleChange} className="border p-2 rounded" placeholder="Email representante *" type="email" required />
                <input name="representante_telefono" value={data.representante_telefono} onChange={handleChange} className="border p-2 rounded" placeholder="Teléfono representante *" required />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="text-lg font-bold mb-3 text-blue-700">Términos y condiciones</h3>
              <div className="mb-4 flex items-center">
                <input
                  id="condiciones"
                  type="checkbox"
                  checked={aceptaCondiciones}
                  onChange={e => setAceptaCondiciones(e.target.checked)}
                  className="mr-2"
                  required
                />
                <label htmlFor="condiciones" className="text-sm">
                  He leído y acepto las <a href="/condiciones" target="_blank" className="underline text-blue-600">condiciones del servicio</a> <span className="text-red-600">*</span>
                </label>
              </div>
              {condicionesError && <div className="text-red-500 mb-2">{condicionesError}</div>}
            </>
          )}

          {/* Aviso dinámico si solicita información web */}
          {mostrarAvisoWeb && (
            <div className="mt-6 border-t pt-4 text-blue-800 text-sm bg-blue-50 rounded">
              <b>¿No tienes página web aún?</b><br />
              Solicitaste información para la creación de tu página web.<br />
              Puedes contactarnos directamente en <a href="mailto:contacto@dbandurria.cl" className="underline text-green-700">contacto@dbandurria.cl</a> o visitar <a href="https://dbandurria.cl" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-blue-900">dbandurria.cl</a> para conocer más.<br/>
              Pronto un asesor de Digital Bandurria SPA se pondrá en contacto contigo.
            </div>
          )}

          <div className="flex justify-between mt-6 gap-2">
            {step > 0 && (
              <button type="button" className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300" onClick={handleBack}>
                Atrás
              </button>
            )}
            <div className="flex-grow" />
            {step < steps.length - 1 ? (
              <button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800 shadow transition">
                Siguiente
              </button>
            ) : (
              <button type="submit" className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800 shadow transition" disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar solicitud"}
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="text-xs text-gray-400 mt-4">Digital Bandurria &copy; {new Date().getFullYear()}</div>
    </div>
  );
}