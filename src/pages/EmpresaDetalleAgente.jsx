import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function EmpresaDetalleAgente() {
  const { empresaId } = useParams();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [validando, setValidando] = useState(false);

  useEffect(() => {
    fetchEmpresa();
    // eslint-disable-next-line
  }, [empresaId]);

  const fetchEmpresa = async () => {
    try {
      const docRef = doc(db, 'empresas', empresaId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setEmpresa({ id: docSnap.id, ...docSnap.data() });
      } else {
        setError('Empresa no encontrada');
      }
    } catch (error) {
      setError('Error al cargar la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleValidarEmpresa = async () => {
    setValidando(true);
    try {
      await updateDoc(doc(db, 'empresas', empresaId), {
        estado: 'validada',
        fecha_validacion: new Date()
      });
      setEmpresa(prev => ({ ...prev, estado: 'validada' }));
    } catch (error) {
      setError('Error al validar la empresa');
    } finally {
      setValidando(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando empresa...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }
  if (!empresa) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Empresa: {empresa.nombre}</h1>
      <div className="mb-4 text-gray-600">Estado actual: <span className={`font-semibold ${empresa.estado === 'validada' ? 'text-green-700' : 'text-blue-700'}`}>{empresa.estado}</span></div>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="font-semibold">Dirección:</div>
          <div>{empresa.direccion}</div>
        </div>
        <div>
          <div className="font-semibold">Teléfono:</div>
          <div>{empresa.telefono}</div>
        </div>
        <div>
          <div className="font-semibold">Email:</div>
          <div>{empresa.email}</div>
        </div>
        <div>
          <div className="font-semibold">Web:</div>
          <div>{empresa.web ? <a href={empresa.web.startsWith('http') ? empresa.web : `https://${empresa.web}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{empresa.web}</a> : 'No definida'}</div>
        </div>
        <div>
          <div className="font-semibold">Categoría:</div>
          <div>{empresa.categoria}</div>
        </div>
        <div>
          <div className="font-semibold">Tipo de Empresa:</div>
          <div>{empresa.tipoEmpresa}</div>
        </div>
      </div>
      <div className="mb-6">
        <div className="font-semibold mb-2">Descripción:</div>
        <div className="bg-gray-50 p-3 rounded-lg">{empresa.descripcion}</div>
      </div>
      <div className="mb-6">
        <div className="font-semibold mb-2">Servicios:</div>
        <div className="flex flex-wrap gap-2">
          {empresa.servicios && empresa.servicios.length > 0 ? empresa.servicios.map((s, i) => <span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded">{s}</span>) : 'No definidos'}
        </div>
      </div>
      <div className="mb-6">
        <div className="font-semibold mb-2">Marcas:</div>
        <div className="flex flex-wrap gap-2">
          {empresa.marcas && empresa.marcas.length > 0 ? empresa.marcas.map((m, i) => <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{m}</span>) : 'No definidas'}
        </div>
      </div>
      <div className="mb-8">
        <div className="font-semibold mb-2">Representante:</div>
        {empresa.representante ? (
          <div>
            <div>{empresa.representante.nombre} {empresa.representante.apellidos}</div>
            <div>{empresa.representante.email}</div>
            <div>{empresa.representante.telefono}</div>
          </div>
        ) : 'No definido'}
      </div>
      {empresa.estado !== 'validada' && (
        <button
          onClick={handleValidarEmpresa}
          disabled={validando}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {validando ? 'Validando...' : 'Marcar como Validada'}
        </button>
      )}
      {empresa.estado === 'validada' && (
        <div className="mt-4 text-green-700 font-semibold">Empresa validada correctamente</div>
      )}
      <div className="mt-8">
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">← Volver</button>
      </div>
    </div>
  );
}
