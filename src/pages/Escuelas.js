import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { Dialog } from "@headlessui/react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "react-toastify";
import Header from "../components/Header";

const Escuelas = () => {
  const [escuelas, setEscuelas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
    directorNombre: "",
  });
  const profesorId = auth.currentUser?.uid;

  useEffect(() => {
    fetchEscuelas();
  }, []);


  const fetchEscuelas = async () => {
    if (!profesorId) return;
    try {
      const q = query(collection(db, "escuelas"), where("profesorId", "==", profesorId));
      const querySnapshot = await getDocs(q);
      const escuelasData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      // Ordenar por el campo 'orden'
      escuelasData.sort((a, b) => (a.orden || 0) - (b.orden || 0));
      setEscuelas(escuelasData);
    } catch (error) {
      console.error("Error al cargar las escuelas:", error);
    }
  };

  const handleAddOrUpdateEscuela = async () => {
    if (!formData.nombre.trim()) {
      toast.error("El nombre de la escuela no puede estar vacío.");
      return;
    }

    try {
      if (isEditMode) {
        // Actualizar escuela
        const escuelaRef = doc(db, "escuelas", editId);
        await updateDoc(escuelaRef, { ...formData });
        toast.success("Escuela actualizada correctamente.");
      } else {
        // Obtener el valor máximo de 'orden' existente
        const q = query(collection(db, "escuelas"), where("profesorId", "==", profesorId));
        const querySnapshot = await getDocs(q);
        const maxOrden = querySnapshot.docs.reduce((max, doc) => {
          const data = doc.data();
          return data.orden > max ? data.orden : max;
        }, 0);

        // Crear nueva escuela con el siguiente valor de 'orden'
        await addDoc(collection(db, "escuelas"), {
          ...formData,
          profesorId: profesorId,
          createdAt: new Date(),
          orden: maxOrden + 1,
        });
        toast.success("Escuela creada correctamente.");
      }

      setFormData({
        nombre: "",
        direccion: "",
        telefono: "",
        email: "",
        directorNombre: "",
      });
      setIsModalOpen(false);
      setIsEditMode(false);
      fetchEscuelas();
    } catch (error) {
      console.error("Error al guardar la escuela:", error);
      toast.error("Error al guardar la escuela.");
    }
  };

  const handleEdit = (escuela) => {
    setFormData({
      nombre: escuela.nombre,
      direccion: escuela.direccion || "",
      telefono: escuela.telefono || "",
      email: escuela.email || "",
      directorNombre: escuela.directorNombre || "", // Nuevo campo
      orden: escuela.orden || "", // Nuevo campo
    });
    setEditId(escuela.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      // Crear un batch de escritura
      const batch = writeBatch(db);

      // Obtener los grados asociados a la escuela
      const gradosQuery = query(collection(db, "grados"), where("escuela", "==", id));
      const gradosSnapshot = await getDocs(gradosQuery);

      // Eliminar las materias y grados asociados
      gradosSnapshot.forEach(async (gradoDoc) => {
        const gradoId = gradoDoc.id;

        // Eliminar las materias asociadas al grado
        const materiasQuery = query(collection(db, "materias"), where("gradoId", "==", gradoId));
        const materiasSnapshot = await getDocs(materiasQuery);

        materiasSnapshot.forEach((materiaDoc) => {
          const materiaRef = doc(db, "materias", materiaDoc.id);
          batch.delete(materiaRef); // Eliminar materia
        });

        // Eliminar el grado
        const gradoRef = doc(db, "grados", gradoId);
        batch.delete(gradoRef);
      });

      // Ejecutar el batch para eliminar grados y materias
      await batch.commit();

      // Eliminar la escuela
      const escuelaRef = doc(db, "escuelas", id);
      await deleteDoc(escuelaRef);

      toast.success("Escuela y todos los datos asociados eliminados correctamente.");
      fetchEscuelas(); // Actualizar la lista de escuelas
    } catch (error) {
      console.error("Error al eliminar la escuela y sus datos asociados:", error);
      toast.error("Error al eliminar la escuela.");
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <Header />

      {/* Botón para abrir el modal alineado a la derecha */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => {
            setFormData({ nombre: "", direccion: "", telefono: "", email: "", directorNombre: "", orden: "" });
            setIsEditMode(false);
            setIsModalOpen(true);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <Plus size={20} />
          Crear Escuela
        </button>
      </div>

      {/* Lista de escuelas */}
      {escuelas.length === 0 ? (
        <p className="text-gray-400 text-center">No tienes escuelas registradas.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {escuelas.map((escuela) => (
            <div
              key={escuela.id}
              className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col justify-between border border-gray-700 hover:border-purple-500 transition"
            >
              <div>
                <h2 className="text-2xl font-bold text-purple-400 mb-4 text-center">
                  {escuela.nombre}
                </h2>
                <p className="text-gray-300 mb-2">
                  <strong>Dirección:</strong> {escuela.direccion || "Sin dirección"}
                </p>
                <p className="text-gray-300 mb-2">
                  <strong>Teléfono:</strong> {escuela.telefono || "Sin teléfono"}
                </p>
                <p className="text-gray-300 mb-2">
                  <strong>Email:</strong> {escuela.email || "Sin email"}
                </p>
                <p className="text-gray-300 mb-2">
                  <strong>Director:</strong> {escuela.directorNombre || "Sin director"}
                </p>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => handleEdit(escuela)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-md flex items-center gap-1"
                >
                  <Pencil size={16} />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(escuela.id)}
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

      {/* Modal para crear/editar escuela */}
      {isModalOpen && (
        <Dialog
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold text-white mb-4">
              {isEditMode ? "Editar Escuela" : "Crear Nueva Escuela"}
            </h2>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Nombre de la escuela"
              className="w-full p-2 mb-4 rounded-md bg-gray-700 text-white"
            />
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Dirección"
              className="w-full p-2 mb-4 rounded-md bg-gray-700 text-white"
            />
            <input
              type="text"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="Teléfono"
              className="w-full p-2 mb-4 rounded-md bg-gray-700 text-white"
            />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email"
              className="w-full p-2 mb-4 rounded-md bg-gray-700 text-white"
            />
            <input
              type="text"
              value={formData.directorNombre}
              onChange={(e) => setFormData({ ...formData, directorNombre: e.target.value })}
              placeholder="Nombre del director"
              className="w-full p-2 mb-4 rounded-md bg-gray-700 text-white"
            /> {/* Nuevo campo */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddOrUpdateEscuela}
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

export default Escuelas;
