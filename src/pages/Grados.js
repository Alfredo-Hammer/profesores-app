import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebaseConfig";
import { Dialog } from "@headlessui/react";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "react-toastify";
import Header from "../components/Header";

const Grados = () => {
  const [grados, setGrados] = useState([]);
  const [escuelas, setEscuelas] = useState([]); // Lista de escuelas
  const [selectedEscuela, setSelectedEscuela] = useState(null); // Escuela seleccionada
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    grado: "",
    nivelEducativo: "",
    turno: "",
    escuela: "",
    secciones: "",
    materias: [],
  });
  const [user] = useAuthState(auth);
  const [materias, setMaterias] = useState([]); // Lista de materias del profesor
  const [isLoading, setIsLoading] = useState(false); // Loading state

  useEffect(() => {
    fetchEscuelas(); // Realizar una consulta única para obtener las escuelas
    let unsubscribeGrados = null;

    if (selectedEscuela) {
      unsubscribeGrados = fetchGrados(); // Escuchar cambios en grados de la escuela seleccionada
    }

    return () => {
      if (unsubscribeGrados) unsubscribeGrados(); // Detener la escucha de cambios en grados
    };
  }, [user, selectedEscuela]); // Asegúrate de incluir `selectedEscuela` como dependencia

  useEffect(() => {
    const fetchMaterias = async () => {
      if (!user) return;

      try {
        const materiasQuery = query(
          collection(db, "materias"),
          where("profesorId", "==", user.uid) // Filtrar por el profesor autenticado
        );
        const materiasSnapshot = await getDocs(materiasQuery);
        const materiasData = materiasSnapshot.docs.map((doc) => ({
          id: doc.id,
          nombre: doc.data().nombre,
        }));
        setMaterias(materiasData);
      } catch (error) {
        console.error("Error al obtener las materias:", error);
      }
    };

    fetchMaterias();
  }, [user]);

  const fetchGrados = () => {
    if (!user || !selectedEscuela) return; // Verificar que `user` y `selectedEscuela` estén definidos
    setIsLoading(true); // Start loading
    try {
      const gradosQuery = query(
        collection(db, "grados"),
        where("profesorId", "==", user.uid),
        where("escuela", "==", selectedEscuela.nombre)
      );

      // Escuchar cambios en tiempo real
      const unsubscribe = onSnapshot(gradosQuery, (snapshot) => {
        const gradosData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Ordenar los grados por el campo "orden" en forma ascendente
        const gradosOrdenados = gradosData.sort((a, b) => a.orden - b.orden);
        setGrados(gradosOrdenados);
        setIsLoading(false); // Stop loading after data is fetched
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error al obtener grados:", error);
      setIsLoading(false); // Stop loading on error
    }
  };

  const fetchEscuelas = async () => {
    if (!user) return;
    try {
      const escuelasQuery = query(collection(db, "escuelas"), where("profesorId", "==", user.uid));
      const snapshot = await getDocs(escuelasQuery); // Realizar una consulta única
      const escuelasData = snapshot.docs.map((doc) => ({
        id: doc.id,
        nombre: doc.data().nombre,
      }));
      setEscuelas(escuelasData);

      // Si solo hay una escuela, seleccionarla automáticamente
      if (escuelasData.length === 1) {
        setSelectedEscuela(escuelasData[0]);
      }
    } catch (error) {
      console.error("Error al obtener escuelas:", error);
    }
  };

  const handleAddOrUpdateGrado = async () => {
    if (!formData.grado.trim() || !formData.nivelEducativo || !formData.turno || !formData.escuela) {
      toast.error("Por favor, completa todos los campos obligatorios.");
      return;
    }

    try {
      let orden = 1; // Valor predeterminado para el primer grado

      // Si no estamos en modo edición, calcular el siguiente número de orden
      if (!isEditMode) {
        const gradosQuery = query(
          collection(db, "grados"),
          where("profesorId", "==", user.uid),
          where("escuela", "==", formData.escuela)
        );
        const gradosSnapshot = await getDocs(gradosQuery);

        // Obtener el número más alto de "orden" y sumar 1
        const gradosData = gradosSnapshot.docs.map((doc) => doc.data());
        const maxOrden = gradosData.reduce((max, grado) => (grado.orden > max ? grado.orden : max), 0);
        orden = maxOrden + 1;
      }

      const gradoData = {
        ...formData,
        secciones: formData.secciones.split(",").map((seccion) => seccion.trim()),
        materias: formData.materias || [], // Asociar materias seleccionadas
        profesorId: user.uid,
        escuelaId: escuelas.find((escuela) => escuela.nombre === formData.escuela)?.id || null, // Asociar escuelaId
        orden, // Asignar el número de orden calculado
      };

      if (isEditMode) {
        const gradoRef = doc(db, "grados", editId);
        await updateDoc(gradoRef, gradoData);
        toast.success("Grado actualizado correctamente.");
      } else {
        await addDoc(collection(db, "grados"), gradoData);
        toast.success("Grado creado correctamente.");
      }

      setFormData({
        grado: "",
        nivelEducativo: "",
        turno: "",
        escuela: "",
        secciones: "",
        materias: [],
      });
      setIsModalOpen(false);
      setIsEditMode(false);
      fetchGrados();
    } catch (error) {
      console.error("Error al guardar el grado:", error);
      toast.error("Error al guardar el grado.");
    }
  };

  const getMateriaNames = (materiaIds) => {
    return materiaIds
      .map((id) => materias.find((materia) => materia.id === id)?.nombre)
      .filter((nombre) => nombre) // Filtrar nombres válidos
      .join(", ");
  };

  const handleEdit = (grado) => {
    setFormData({
      grado: grado.grado,
      nivelEducativo: grado.nivelEducativo,
      turno: grado.turno,
      escuela: grado.escuela,
      secciones: grado.secciones.join(", "),
      materias: grado.materias || [],
    });
    setEditId(grado.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "grados", id));
      toast.success("Grado eliminado correctamente.");
      fetchGrados();
    } catch (error) {
      console.error("Error al eliminar el grado:", error);
      toast.error("Error al eliminar el grado.");
    }
  };

  const handleMateriaChange = (materiaId) => {
    setFormData((prevFormData) => {
      const materiasSeleccionadas = prevFormData.materias || [];
      if (materiasSeleccionadas.includes(materiaId)) {
        // Si la materia ya está seleccionada, eliminarla
        return {
          ...prevFormData,
          materias: materiasSeleccionadas.filter((id) => id !== materiaId),
        };
      } else {
        // Si la materia no está seleccionada, agregarla
        return {
          ...prevFormData,
          materias: [...materiasSeleccionadas, materiaId],
        };
      }
    });
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <Header />

      {/* Escuelas */}
      {!selectedEscuela ? (
        <div className="w-full">
          <h2 className="text-2xl font-bold text-purple-400 mb-4">Escuelas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {escuelas.map((escuela, index) => (
              <div
                key={escuela.id}
                className={`bg-opacity-80 p-6 rounded-lg shadow-lg border-2 border-gray-700 hover:border-purple-500 transition ${index % 2 === 0 ? "bg-blue-800" : "bg-green-800"
                  }`}
              >
                <h3 className="text-xl font-bold text-purple-400 mb-3 text-center">{escuela.nombre}</h3>
                <div className="flex justify-center">
                  <button
                    onClick={() => setSelectedEscuela(escuela)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
                  >
                    <Eye size={16} />
                    Ver Grados
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Grados */}
      {selectedEscuela ? (
        <div className="w-full">
          <h2 className="text-2xl font-bold text-purple-400 mb-4">Grados en {selectedEscuela.nombre}</h2>
          {escuelas.length > 1 && (
            <button
              onClick={() => setSelectedEscuela(null)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md mb-4"
            >
              Volver a Escuelas
            </button>
          )}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => {
                setFormData({
                  grado: "",
                  nivelEducativo: "",
                  turno: "",
                  escuela: selectedEscuela.nombre,
                  secciones: "",
                  materias: [],
                });
                setIsEditMode(false);
                setIsModalOpen(true);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
            >
              <Plus size={20} />
              Crear Grado
            </button>
          </div>
          {isLoading ? (
            <p className="text-gray-400 text-center">Cargando grados...</p>
          ) : grados.length === 0 ? (
            <p className="text-gray-400 text-center">No hay grados registrados en esta escuela.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 text-white rounded-lg shadow-lg">
                <thead>
                  <tr className="bg-gray-700 text-left">
                    <th className="px-6 py-3 text-sm font-medium text-gray-300 uppercase">#</th>
                    <th className="px-6 py-3 text-sm font-medium text-gray-300 uppercase">Grado</th>
                    <th className="px-6 py-3 text-sm font-medium text-gray-300 uppercase">Nivel Educativo</th>
                    <th className="px-6 py-3 text-sm font-medium text-gray-300 uppercase">Turno</th>
                    <th className="px-6 py-3 text-sm font-medium text-gray-300 uppercase">Secciones</th>
                    <th className="px-6 py-3 text-sm font-medium text-gray-300 uppercase">Materias</th>
                    <th className="px-6 py-3 text-sm font-medium text-gray-300 uppercase text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {grados.map((grado, index) => (
                    <tr
                      key={grado.id}
                      className={`border-b border-gray-700 ${index % 2 === 0 ? "bg-gray-800" : "bg-gray-700"}`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-200">{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-200">{grado.grado}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{grado.nivelEducativo || "Sin nivel educativo"}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{grado.turno || "Sin turno"}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {grado.secciones && grado.secciones.length > 0
                          ? grado.secciones.join(", ")
                          : "Sin secciones"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {grado.materias && grado.materias.length > 0
                          ? getMateriaNames(grado.materias)
                          : "Sin materias seleccionadas"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(grado)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-md flex items-center gap-1"
                          >
                            <Pencil size={16} />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(grado.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md flex items-center gap-1"
                          >
                            <Trash2 size={16} />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {/* Modal para crear/editar grado */}
      {isModalOpen && (
        <Dialog
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold text-white mb-4">
              {isEditMode ? "Editar Grado" : "Crear Nuevo Grado"}
            </h2>
            <input
              type="text"
              value={formData.grado}
              onChange={(e) => setFormData({ ...formData, grado: e.target.value })}
              placeholder="Nombre del grado"
              className="w-full p-2 mb-4 rounded-md bg-gray-700 text-white"
            />
            <select
              value={formData.nivelEducativo}
              onChange={(e) => setFormData({ ...formData, nivelEducativo: e.target.value })}
              className="w-full p-2 mb-4 rounded-md bg-gray-700 text-white"
            >
              <option value="">Selecciona el nivel educativo</option>
              <option value="Primaria">Primaria</option>
              <option value="Secundaria">Secundaria</option>
              <option value="Sabatino">Sabatino</option>
              <option value="Universidad">Universidad</option>
            </select>
            <select
              value={formData.turno}
              onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
              className="w-full p-2 mb-4 rounded-md bg-gray-700 text-white"
            >
              <option value="">Selecciona el turno</option>
              <option value="Matutino">Matutino</option>
              <option value="Vespertino">Vespertino</option>
              <option value="Nocturno">Nocturno</option>
              <option value="Sabatino">Sabatino</option>
              <option value="Otro">Otro</option>
            </select>
            <input
              type="text"
              value={formData.secciones}
              onChange={(e) => setFormData({ ...formData, secciones: e.target.value })}
              placeholder="Secciones (separadas por comas)"
              className="w-full p-2 mb-4 rounded-md bg-gray-700 text-white"
            />
            <div className="mb-4">
              <label className="block text-white mb-2">Selecciona las materias:</label>
              <div className="max-h-40 overflow-y-auto bg-gray-700 p-2 rounded-md">
                {materias.map((materia) => (
                  <div key={materia.id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`materia-${materia.id}`}
                      checked={formData.materias.includes(materia.id)}
                      onChange={() => handleMateriaChange(materia.id)}
                      className="mr-2"
                    />
                    <label htmlFor={`materia-${materia.id}`} className="text-white">
                      {materia.nombre}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddOrUpdateGrado}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Guardar
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default Grados;