import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const AdminMarcas = () => {
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMarca, setNewMarca] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [adding, setAdding] = useState(false);

  // Marcas predefinidas para autocompletar
  const marcasPredefinidas = [
    'Toyota', 'Volkswagen', 'Ford', 'Chevrolet', 'Nissan', 'Honda', 'Hyundai',
    'Kia', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen Comerciales', 'Renault',
    'Peugeot', 'Citroën', 'Fiat', 'Jeep', 'Dodge', 'Ram', 'Chrysler',
    'Subaru', 'Mazda', 'Mitsubishi', 'Suzuki', 'Isuzu', 'Daihatsu',
    'Lexus', 'Infiniti', 'Acura', 'Cadillac', 'Buick', 'GMC', 'Lincoln',
    'Volvo', 'Saab', 'Jaguar', 'Land Rover', 'Mini', 'Porsche',
    'Ferrari', 'Lamborghini', 'Maserati', 'Alfa Romeo', 'Lancia',
    'Skoda', 'Seat', 'Opel', 'Vauxhall', 'Holden'
  ];

  const fetchMarcas = async () => {
    try {
      setLoading(true);
      setError(null);
      const marcasCollection = collection(db, 'marcas');
      const marcasSnapshot = await getDocs(marcasCollection);
      const marcasList = marcasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Ordenar alfabéticamente
      marcasList.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setMarcas(marcasList);
    } catch (err) {
      console.error('Error al obtener marcas:', err);
      setError('Error al cargar las marcas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarcas();
  }, []);

  const handleAddMarca = async (e) => {
    e.preventDefault();
    if (!newMarca.trim()) return;

    // Verificar si la marca ya existe
    const marcaExistente = marcas.find(
      marca => marca.nombre.toLowerCase() === newMarca.trim().toLowerCase()
    );

    if (marcaExistente) {
      alert('Esta marca ya existe');
      return;
    }

    try {
      setAdding(true);
      const marcasCollection = collection(db, 'marcas');
      const docRef = await addDoc(marcasCollection, {
        nombre: newMarca.trim(),
        fechaCreacion: new Date()
      });
      
      const nuevaMarca = {
        id: docRef.id,
        nombre: newMarca.trim(),
        fechaCreacion: new Date()
      };
      
      setMarcas(prev => [...prev, nuevaMarca].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setNewMarca('');
      setShowForm(false);
    } catch (err) {
      console.error('Error al agregar marca:', err);
      alert('Error al agregar la marca');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteMarca = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la marca "${nombre}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'marcas', id));
      setMarcas(prev => prev.filter(marca => marca.id !== id));
    } catch (err) {
      console.error('Error al eliminar marca:', err);
      alert('Error al eliminar la marca');
    }
  };

  const handleEditMarca = async (id) => {
    if (!editingName.trim()) return;

    // Verificar si la nueva marca ya existe (excepto la actual)
    const marcaExistente = marcas.find(
      marca => marca.nombre.toLowerCase() === editingName.trim().toLowerCase() && marca.id !== id
    );

    if (marcaExistente) {
      alert('Ya existe una marca con este nombre');
      return;
    }

    try {
      await updateDoc(doc(db, 'marcas', id), {
        nombre: editingName.trim()
      });
      
      setMarcas(prev => 
        prev.map(marca => 
          marca.id === id 
            ? { ...marca, nombre: editingName.trim() }
            : marca
        ).sort((a, b) => a.nombre.localeCompare(b.nombre))
      );
      
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      console.error('Error al actualizar marca:', err);
      alert('Error al actualizar la marca');
    }
  };

  const startEdit = (marca) => {
    setEditingId(marca.id);
    setEditingName(marca.nombre);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const addMarcasPredefinidas = async () => {
    if (!window.confirm('¿Deseas agregar todas las marcas predefinidas que no existen aún?')) {
      return;
    }

    try {
      setAdding(true);
      const marcasCollection = collection(db, 'marcas');
      const marcasExistentes = marcas.map(m => m.nombre.toLowerCase());
      
      const marcasParaAgregar = marcasPredefinidas.filter(
        marca => !marcasExistentes.includes(marca.toLowerCase())
      );

      const promesas = marcasParaAgregar.map(marca => 
        addDoc(marcasCollection, {
          nombre: marca,
          fechaCreacion: new Date()
        })
      );

      await Promise.all(promesas);
      await fetchMarcas(); // Recargar todas las marcas
      alert(`Se agregaron ${marcasParaAgregar.length} marcas nuevas`);
    } catch (err) {
      console.error('Error al agregar marcas predefinidas:', err);
      alert('Error al agregar las marcas predefinidas');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Marcas</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showForm ? 'Cancelar' : 'Nueva Marca'}
            </button>
            {marcas.length === 0 && (
              <button
                onClick={addMarcasPredefinidas}
                disabled={adding}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {adding ? 'Agregando...' : 'Agregar Marcas Básicas'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <form onSubmit={handleAddMarca} className="flex gap-2">
              <input
                type="text"
                value={newMarca}
                onChange={(e) => setNewMarca(e.target.value)}
                placeholder="Nombre de la marca"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                list="marcas-sugeridas"
                required
              />
              <datalist id="marcas-sugeridas">
                {marcasPredefinidas
                  .filter(marca => 
                    !marcas.some(m => m.nombre.toLowerCase() === marca.toLowerCase())
                  )
                  .map(marca => (
                    <option key={marca} value={marca} />
                  ))
                }
              </datalist>
              <button
                type="submit"
                disabled={adding}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {adding ? 'Agregando...' : 'Agregar'}
              </button>
            </form>
          </div>
        )}

        <div className="mb-4">
          <p className="text-gray-600">
            Total de marcas: <span className="font-semibold">{marcas.length}</span>
          </p>
          {marcas.length > 0 && (
            <button
              onClick={addMarcasPredefinidas}
              disabled={adding}
              className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {adding ? 'Agregando...' : 'Agregar Marcas Faltantes'}
            </button>
          )}
        </div>

        <div className="grid gap-2">
          {marcas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay marcas registradas</p>
              <p className="text-sm">Usa el botón "Agregar Marcas Básicas" para comenzar</p>
            </div>
          ) : (
            marcas.map((marca) => (
              <div
                key={marca.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                {editingId === marca.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleEditMarca(marca.id);
                        } else if (e.key === 'Escape') {
                          cancelEdit();
                        }
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleEditMarca(marca.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-gray-800 font-medium">{marca.nombre}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(marca)}
                        className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteMarca(marca.id, marca.nombre)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMarcas;