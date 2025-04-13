import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch, getDoc } from "firebase/firestore";
import { Dialog } from "@headlessui/react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "react-toastify";
import Header from "../components/Header";

const Escuelas = () => {
  const [escuelas, setEscuelas] = useState([]);
  const [profesorNombre, setProfesorNombre] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
    directorNombre: "",
    logo: "", // Nuevo campo para el logo
    descripcion: "", // Nuevo campo para la descripción
  });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const profesorId = auth.currentUser?.uid;

  useEffect(() => {
    fetchEscuelas();
    fetchProfesorNombre();
  }, []);

  const fetchProfesorNombre = async () => {
    if (!profesorId) {
      console.error("El profesorId no está disponible.");
      setProfesorNombre("Sin nombre");
      return;
    }

    try {
      console.log("Consultando el nombre del profesor con ID:", profesorId);
      const profesorDoc = await getDoc(doc(db, "users", profesorId)); // Cambiar a getDoc para obtener el documento directamente

      if (profesorDoc.exists()) {
        const userData = profesorDoc.data();
        console.log("Datos del profesor obtenidos:", userData);
        setProfesorNombre(`${userData.nombre} ${userData.apellido}`);
      } else {
        console.warn("No se encontró un usuario con el ID proporcionado:", profesorId);
        setProfesorNombre("Sin nombre");
      }
    } catch (error) {
      console.error("Error al obtener el nombre del profesor:", error);
      setProfesorNombre("Sin nombre");
    }
  };

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
        logo: "", // Nuevo campo para el logo
        descripcion: "", // Nuevo campo para la descripción
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
      logo: escuela.logo || "", // Nuevo campo para el logo
      descripcion: escuela.descripcion || "", // Nuevo campo para la descripción
    });
    setEditId(escuela.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openConfirmModal = (id) => {
    setDeleteId(id);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await handleDelete(deleteId);
      setIsConfirmModalOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error al confirmar la eliminación:", error);
      toast.error("Error al eliminar la escuela.");
    }
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
            setFormData({ nombre: "", direccion: "", telefono: "", email: "", directorNombre: "", orden: "", logo: "", descripcion: "" });
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
      ) : escuelas.length === 1 ? (
        // Diseño para una sola escuela con fondo degradado
        <div className="p-6 rounded-lg shadow-lg border border-gray-700 bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 relative">
          {/* Nombre del profesor */}
          <p className="absolute top-4 left-4 text-sm text-gray-200 italic">
            Profesor: {profesorNombre}
          </p>
          <div className="flex flex-col items-center">
            {escuelas[0].logo ? (
              <img
                src={escuelas[0].logo}
                alt={`Logo de ${escuelas[0].nombre}`}
                className="w-32 h-32 object-cover rounded-full mb-4 border-4 border-white"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <span className="text-gray-400 text-sm">Sin logo</span>
              </div>
            )}
            <h2 className="text-3xl font-bold text-white mb-4 text-center">{escuelas[0].nombre}</h2>
            <p className="text-gray-200 text-center mb-4">{escuelas[0].descripcion || "Sin descripción"}</p>
          </div>
          <div>
            <p className="text-gray-200 mb-2">
              <strong>Dirección:</strong> {escuelas[0].direccion || "Sin dirección"}
            </p>
            <p className="text-gray-200 mb-2">
              <strong>Teléfono:</strong> {escuelas[0].telefono || "Sin teléfono"}
            </p>
            <p className="text-gray-200 mb-2">
              <strong>Email:</strong> {escuelas[0].email || "Sin email"}
            </p>
            <p className="text-gray-200 mb-2">
              <strong>Director:</strong> {escuelas[0].directorNombre || "Sin director"}
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => handleEdit(escuelas[0])}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-md flex items-center gap-1"
            >
              <Pencil size={16} />
              Editar
            </button>
            <button
              onClick={() => openConfirmModal(escuelas[0].id)}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md flex items-center gap-1"
            >
              <Trash2 size={16} />
              Eliminar
            </button>
          </div>
        </div>
      ) : (
        // Diseño para múltiples escuelas
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {escuelas.map((escuela) => (
            <div
              key={escuela.id}
              className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col justify-between border border-gray-700 hover:border-purple-500 transition"
            >
              <div className="flex flex-col items-center">
                {escuela.logo ? (
                  <img
                    src={escuela.logo}
                    alt={`Logo de ${escuela.nombre}`}
                    className="w-24 h-24 object-cover rounded-full mb-4"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <span className="text-gray-400 text-sm">Sin logo</span>
                  </div>
                )}
                <h2 className="text-2xl font-bold text-purple-400 mb-2 text-center">{escuela.nombre}</h2>
                <p className="text-gray-300 text-center mb-4">{escuela.descripcion || "Sin descripción"}</p>
              </div>
              <div>
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
                  onClick={() => openConfirmModal(escuela.id)}
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
            />
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción de la escuela"
              className="w-full p-2 mb-4 rounded-md bg-gray-700 text-white"
            ></textarea>
            <input
              type="text"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              placeholder="URL del logo"
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
                onClick={handleAddOrUpdateEscuela}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Guardar
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Modal de confirmación */}
      {isConfirmModalOpen && (
        <Dialog
          open={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold text-white mb-4">Confirmar Eliminación</h2>
            <p className="text-gray-300 mb-6">¿Estás seguro de que deseas eliminar esta escuela? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
              >
                Eliminar
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default Escuelas;
