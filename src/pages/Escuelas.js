import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Dialog } from "@headlessui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import Header from "../components/Header";

const Escuelas = () => {
  const [escuelas, setEscuelas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEscuela, setSelectedEscuela] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
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
      setEscuelas(escuelasData);
    } catch (error) {
      console.error("Error al cargar las escuelas:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGuardarEscuela = async (e) => {
    e.preventDefault();
    if (!profesorId) {
      console.error("Usuario no autenticado.");
      return;
    }

    try {
      if (selectedEscuela) {
        await updateDoc(doc(db, "escuelas", selectedEscuela.id), formData);
      } else {
        await addDoc(collection(db, "escuelas"), { ...formData, profesorId, createdAt: new Date() });
      }

      setIsModalOpen(false);
      setFormData({ nombre: "", direccion: "", telefono: "" });
      setSelectedEscuela(null);
      fetchEscuelas();
    } catch (error) {
      console.error("Error al guardar escuela:", error);
    }
  };

  const handleEditEscuela = (escuela) => {
    setSelectedEscuela(escuela);
    setFormData({ nombre: escuela.nombre, direccion: escuela.direccion, telefono: escuela.telefono });
    setIsModalOpen(true);
  };

  const handleDeleteEscuela = async () => {
    if (!selectedEscuela) return;
    try {
      await deleteDoc(doc(db, "escuelas", selectedEscuela.id));
      setIsDeleteDialogOpen(false);
      fetchEscuelas();
    } catch (error) {
      console.error("Error al eliminar escuela:", error);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <Header />
      <div className="flex justify-end items-center mb-4 mt-9">
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
          <Plus size={18} /> Nueva Escuela
        </button>
      </div>

      {escuelas.length === 0 ? (
        <p className="text-gray-400 text-center">No tienes escuelas registradas.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {escuelas.map((escuela) => (
            <div key={escuela.id} className="bg-gray-800 p-4 rounded-lg shadow-lg relative">
              <div className="absolute top-2 right-2 flex gap-2">
                <button onClick={() => handleEditEscuela(escuela)} className="text-yellow-400 hover:text-yellow-500">
                  <Edit size={18} />
                </button>
                <button onClick={() => { setSelectedEscuela(escuela); setIsDeleteDialogOpen(true); }} className="text-red-400 hover:text-red-500">
                  <Trash2 size={18} />
                </button>
              </div>
              <h2 className="text-xl font-bold">{escuela.nombre}</h2>
              <p className="text-gray-400">📍 {escuela.direccion}</p>
              <p className="text-gray-500 text-sm">📞 {escuela.telefono}</p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedEscuela(null); }} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[400px]">
          <h2 className="text-xl font-bold mb-4">{selectedEscuela ? "Editar Escuela" : "Crear Escuela"}</h2>
          <form onSubmit={handleGuardarEscuela} className="space-y-3">
            <input type="text" name="nombre" placeholder="Nombre de la Escuela" value={formData.nombre} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded" required />
            <input type="text" name="direccion" placeholder="Dirección" value={formData.direccion} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded" required />
            <input type="text" name="telefono" placeholder="Teléfono" value={formData.telefono} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded" required />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-600 px-4 py-2 rounded">Cancelar</button>
              <button type="submit" className="bg-blue-600 px-4 py-2 rounded">Guardar</button>
            </div>
          </form>
        </div>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[350px] text-center">
          <Trash2 size={40} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold">¿Eliminar escuela?</h2>
          <p className="text-gray-400">Esta acción no se puede deshacer.</p>
          <div className="flex justify-center gap-4 mt-4">
            <button onClick={() => setIsDeleteDialogOpen(false)} className="bg-gray-600 px-4 py-2 rounded">Cancelar</button>
            <button onClick={handleDeleteEscuela} className="bg-red-600 px-4 py-2 rounded">Eliminar</button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Escuelas;
