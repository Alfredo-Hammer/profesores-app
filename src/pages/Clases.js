import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Dialog } from "@headlessui/react";
import { Plus, Trash2, Edit } from "lucide-react";
import Header from "../components/Header";

const Clases = () => {
  const [clases, setClases] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedClase, setSelectedClase] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    horario: "",
    ubicacion: "",
    capacidad: "",
    materia: "",
  });

  const profesorId = auth.currentUser?.uid;

  useEffect(() => {
    fetchClases();
  }, []);

  const fetchClases = async () => {
    if (!profesorId) return;
    try {
      const q = query(collection(db, "clases"), where("profesorId", "==", profesorId));
      const querySnapshot = await getDocs(q);
      const clasesData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setClases(clasesData);
    } catch (error) {
      console.error("Error al cargar las clases:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGuardarClase = async (e) => {
    e.preventDefault();
    if (!profesorId) {
      console.error("Usuario no autenticado.");
      return;
    }

    try {
      if (selectedClase) {
        // Actualizar clase existente
        const claseRef = doc(db, "clases", selectedClase.id);
        await updateDoc(claseRef, formData);
      } else {
        // Crear nueva clase
        await addDoc(collection(db, "clases"), {
          ...formData,
          profesorId,
          createdAt: new Date(),
        });
      }

      setIsModalOpen(false);
      setFormData({ nombre: "", descripcion: "", horario: "", ubicacion: "", capacidad: "", materia: "" });
      setSelectedClase(null);
      fetchClases();
    } catch (error) {
      console.error("Error al guardar clase:", error);
    }
  };

  const handleEditarClase = (clase) => {
    setSelectedClase(clase);
    setFormData(clase);
    setIsModalOpen(true);
  };

  const handleEliminarClase = async () => {
    if (!selectedClase) return;
    try {
      await deleteDoc(doc(db, "clases", selectedClase.id));
      setIsConfirmDialogOpen(false);
      setSelectedClase(null);
      fetchClases();
    } catch (error) {
      console.error("Error al eliminar clase:", error);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <Header />
      <div className="flex justify-end items-center mb-4 mt-9">
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
          <Plus size={18} /> Nueva Clase
        </button>
      </div>

      {clases.length === 0 ? (
        <p className="text-gray-400 text-center">No tienes clases registradas.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clases.map((clase) => (
            <div key={clase.id} className="bg-gray-800 p-4 rounded-lg shadow-lg relative">
              <div className="absolute top-2 right-2 flex gap-2">
                <button onClick={() => handleEditarClase(clase)} className="text-blue-400 hover:text-blue-500">
                  <Edit size={18} />
                </button>
                <button onClick={() => { setSelectedClase(clase); setIsConfirmDialogOpen(true); }} className="text-red-400 hover:text-red-500">
                  <Trash2 size={18} />
                </button>
              </div>
              <h2 className="text-xl font-bold">{clase.nombre}</h2>
              <p className="text-gray-400">{clase.descripcion}</p>
              <p className="text-gray-500 text-sm">🕒 {clase.horario}</p>
              <p className="text-gray-500 text-sm">📍 {clase.ubicacion}</p>
              <p className="text-gray-500 text-sm">👥 Capacidad: {clase.capacidad}</p>
              <p className="text-gray-500 text-sm">📖 Materia: {clase.materia}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal para agregar/editar clases */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[400px]">
          <h2 className="text-xl font-bold mb-4">{selectedClase ? "Editar Clase" : "Crear Clase"}</h2>
          <form onSubmit={handleGuardarClase} className="space-y-3">
            <input type="text" name="nombre" placeholder="Nombre de la Clase" value={formData.nombre} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded" required />
            <textarea name="descripcion" placeholder="Descripción" value={formData.descripcion} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded" required />
            <input type="text" name="horario" placeholder="Día y Horario" value={formData.horario} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded" required />
            <input type="text" name="ubicacion" placeholder="Ubicación" value={formData.ubicacion} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded" required />
            <input type="number" name="capacidad" placeholder="Capacidad Máxima" value={formData.capacidad} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded" required />
            <input type="text" name="materia" placeholder="Materia" value={formData.materia} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded" required />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-600 px-4 py-2 rounded">Cancelar</button>
              <button type="submit" className="bg-blue-600 px-4 py-2 rounded">Guardar</button>
            </div>
          </form>
        </div>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <Dialog open={isConfirmDialogOpen} onClose={() => setIsConfirmDialogOpen(false)} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
          <Trash2 size={48} className="text-red-500 mx-auto mb-4" />
          <p>¿Seguro que quieres eliminar la clase: {selectedClase ? ` ${selectedClase.nombre}?` : ""}</p>
          <div className="flex justify-center gap-4 mt-4">
            <button onClick={() => setIsConfirmDialogOpen(false)} className="bg-gray-600 px-4 py-2 rounded">Cancelar</button>
            <button onClick={handleEliminarClase} className="bg-red-600 px-4 py-2 rounded">Eliminar</button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Clases;
