import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Dialog } from "@headlessui/react";
import { Pencil, Trash2, Plus, XCircle, UserCircle } from "lucide-react";

const Alumnos = () => {
  const [alumnos, setAlumnos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    edad: "",
    grado: "",
    escuela: "",
    etnia: "",
  });
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [userData, setUserData] = useState(null);
  const profesorId = auth.currentUser?.uid;

  useEffect(() => {
    fetchAlumnos();
    fetchUserData();
  }, []);

  const fetchAlumnos = async () => {
    if (!profesorId) return;
    const q = query(collection(db, "alumnos"), where("profesorId", "==", profesorId));
    const querySnapshot = await getDocs(q);
    const alumnosData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setAlumnos(alumnosData);
  };

  const fetchUserData = async () => {
    if (!profesorId) return;
    const q = query(collection(db, "users"), where("uid", "==", profesorId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      setUserData(querySnapshot.docs[0].data());
    }
  };

  const handleAddOrUpdateAlumno = async (e) => {
    e.preventDefault();
    if (!profesorId) return;

    try {
      if (editId) {
        await updateDoc(doc(db, "alumnos", editId), formData);
      } else {
        await addDoc(collection(db, "alumnos"), { ...formData, profesorId, createdAt: new Date() });
      }
      setIsModalOpen(false);
      setFormData({ nombre: "", apellido: "", edad: "", grado: "", escuela: "", etnia: "" });
      setEditId(null);
      fetchAlumnos();
    } catch (error) {
      console.error("Error al guardar alumno:", error);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDoc(doc(db, "alumnos", deleteId));
    setIsDeleteModalOpen(false);
    setDeleteId(null);
    fetchAlumnos();
  };

  const handleEdit = (alumno) => {
    setFormData(alumno);
    setEditId(alumno.id);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 bg-gray-800 p-4 rounded-lg">
        <h1 className="text-2xl font-bold">Mis Alumnos</h1>
        <div className="flex items-center gap-3">
          <UserCircle size={32} className="text-gray-300" />
          <span className="text-white font-medium">{userData?.nombre || "Profesor"}</span>
        </div>
      </header>

      <div className="flex justify-between items-center mb-6">
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
          <Plus size={18} /> Agregar Alumno
        </button>
      </div>

      {alumnos.length === 0 ? (
        <p className="text-gray-400">No tienes alumnos registrados.</p>
      ) : (
        <table className="w-full border border-gray-700 rounded-lg overflow-hidden">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Apellido</th>
              <th className="p-3">Edad</th>
              <th className="p-3">Grado</th>
              <th className="p-3">Escuela</th>
              <th className="p-3">Etnia</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((alumno) => (
              <tr key={alumno.id} className="border-b border-gray-700">
                <td className="p-3">{alumno.nombre}</td>
                <td className="p-3">{alumno.apellido}</td>
                <td className="p-3">{alumno.edad}</td>
                <td className="p-3">{alumno.grado}</td>
                <td className="p-3">{alumno.escuela}</td>
                <td className="p-3">{alumno.etnia}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => handleEdit(alumno)} className="text-yellow-400 hover:text-yellow-300">
                    <Pencil size={20} />
                  </button>
                  <button onClick={() => confirmDelete(alumno.id)} className="text-red-500 hover:text-red-300">
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal para agregar/editar alumno */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[400px]">
          <h2 className="text-xl font-bold mb-4">{editId ? "Editar Alumno" : "Agregar Alumno"}</h2>
          <form onSubmit={handleAddOrUpdateAlumno} className="space-y-3">
            <input type="text" name="nombre" placeholder="Nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full p-2 bg-gray-700 rounded" required />
            <input type="text" name="apellido" placeholder="Apellido" value={formData.apellido} onChange={(e) => setFormData({ ...formData, apellido: e.target.value })} className="w-full p-2 bg-gray-700 rounded" required />
            <input type="number" name="edad" placeholder="Edad" value={formData.edad} onChange={(e) => setFormData({ ...formData, edad: e.target.value })} className="w-full p-2 bg-gray-700 rounded" required />
            <input type="text" name="grado" placeholder="Grado" value={formData.grado} onChange={(e) => setFormData({ ...formData, grado: e.target.value })} className="w-full p-2 bg-gray-700 rounded" required />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-600 px-4 py-2 rounded">Cancelar</button>
              <button type="submit" className="bg-blue-600 px-4 py-2 rounded">{editId ? "Actualizar" : "Guardar"}</button>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  );
};

export default Alumnos;
