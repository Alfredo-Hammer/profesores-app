import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
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
  });
  const [user] = useAuthState(auth);

  useEffect(() => {
    fetchEscuelas(); // Cargar las escuelas creadas por el profesor
    if (selectedEscuela) {
      fetchGrados(); // Cargar los grados de la escuela seleccionada
    }
  }, [user, selectedEscuela]);

  const fetchGrados = async () => {
    if (!user || !selectedEscuela) return;
    try {
      const gradosQuery = query(
        collection(db, "grados"),
        where("profesorId", "==", user.uid),
        where("escuela", "==", selectedEscuela.nombre)
      );
      const gradosSnapshot = await getDocs(gradosQuery);
      const gradosData = gradosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Ordenar los grados por el campo "orden" en forma ascendente
      const gradosOrdenados = gradosData.sort((a, b) => a.orden - b.orden);
      setGrados(gradosOrdenados);
    } catch (error) {
      console.error("Error al obtener grados:", error);
    }
  };

  const fetchEscuelas = async () => {
    if (!user) return;
    try {
      const escuelasQuery = query(collection(db, "escuelas"), where("profesorId", "==", user.uid));
      const escuelasSnapshot = await getDocs(escuelasQuery);
      const escuelasData = escuelasSnapshot.docs.map((doc) => ({
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
      });
      setIsModalOpen(false);
      setIsEditMode(false);
      fetchGrados();
    } catch (error) {
      console.error("Error al guardar el grado:", error);
      toast.error("Error al guardar el grado.");
    }
  };

  const handleEdit = (grado) => {
    setFormData({
      grado: grado.grado,
      nivelEducativo: grado.nivelEducativo,
      turno: grado.turno,
      escuela: grado.escuela,
      secciones: grado.secciones.join(", "),
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
          {/* Mostrar el botón "Volver a Escuelas" solo si hay más de una escuela */}
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
          {grados.length === 0 ? (
            <p className="text-gray-400 text-center">No hay grados registrados en esta escuela.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {grados.map((grado) => (
                <div
                  key={grado.id}
                  className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col justify-between"
                  style={{ height: "auto" }}
                >
                  <div>
                    <h2 className="text-xl font-bold text-white text-center mb-4">{grado.grado}</h2>
                    <p className="text-gray-400">
                      <strong>Nivel Educativo:</strong> {grado.nivelEducativo || "Sin nivel educativo"}
                    </p>
                    <p className="text-gray-400">
                      <strong>Turno:</strong> {grado.turno || "Sin turno"}
                    </p>
                    <p className="text-gray-400">
                      <strong>Secciones:</strong>{" "}
                      {grado.secciones && grado.secciones.length > 0
                        ? grado.secciones.join(", ")
                        : "Sin secciones"}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
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
                </div>
              ))}
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