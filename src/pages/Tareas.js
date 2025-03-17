import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Dialog } from "@headlessui/react";
import { Pencil, Trash2, Plus } from "lucide-react";
import Header from "../components/Header";

const Tareas = () => {
  const [tareas, setTareas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    fechaEntrega: "",
    asignadoA: "",
  });
  const [editId, setEditId] = useState(null);
  const profesorId = auth.currentUser?.uid;

  useEffect(() => {
    fetchTareas();
  }, []);

  const fetchTareas = async () => {
    if (!profesorId) return;
    const q = query(collection(db, "tareas"), where("profesorId", "==", profesorId));
    const querySnapshot = await getDocs(q);
    const tareasData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setTareas(tareasData);
  };

  const handleAddOrUpdateTarea = async (e) => {
    e.preventDefault();
    if (!profesorId) return;

    try {
      if (editId) {
        await updateDoc(doc(db, "tareas", editId), formData);
      } else {
        await addDoc(collection(db, "tareas"), { ...formData, profesorId, createdAt: new Date() });
      }
      setIsModalOpen(false);
      setFormData({ titulo: "", descripcion: "", fechaEntrega: "", asignadoA: "" });
      setEditId(null);
      fetchTareas();
    } catch (error) {
      console.error("Error al guardar tarea:", error);
    }
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "tareas", id));
    fetchTareas();
  };

  const handleEdit = (tarea) => {
    setFormData(tarea);
    setEditId(tarea.id);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <Header />
      <div className="flex justify-end my-4">
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
          <Plus size={18} /> Nueva Tarea
        </button>
      </div>
      {tareas.length === 0 ? (
        <p className="text-gray-400 text-center">No tienes tareas asignadas.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tareas.map((tarea) => (
            <li key={tarea.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{tarea.titulo}</h3>
                <p className="text-gray-400">{tarea.descripcion}</p>
                <p className="text-sm text-gray-500">Entrega: {tarea.fechaEntrega}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(tarea)} className="text-yellow-400 hover:text-yellow-300">
                  <Pencil size={20} />
                </button>
                <button onClick={() => handleDelete(tarea.id)} className="text-red-500 hover:text-red-300">
                  <Trash2 size={20} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[400px]">
          <h2 className="text-xl font-bold mb-4">{editId ? "Editar Tarea" : "Nueva Tarea"}</h2>
          <form onSubmit={handleAddOrUpdateTarea} className="space-y-4">
            <input type="text" placeholder="Título" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} className="p-2 bg-gray-700 rounded w-full" required />
            <textarea placeholder="Descripción" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="p-2 bg-gray-700 rounded w-full" required />
            <input type="date" value={formData.fechaEntrega} onChange={(e) => setFormData({ ...formData, fechaEntrega: e.target.value })} className="p-2 bg-gray-700 rounded w-full" required />
            <button type="submit" className="bg-blue-600 px-4 py-2 rounded w-full">{editId ? "Actualizar" : "Guardar"}</button>
          </form>
        </div>
      </Dialog>
    </div>
  );
};

export default Tareas;
