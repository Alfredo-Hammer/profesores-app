import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Dialog } from "@headlessui/react";
import { Pencil, Trash2, Plus } from "lucide-react";
import Header from "../components/Header";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Tareas = () => {
  const [tareas, setTareas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const estadosTarea = ["Pendiente", "En Progreso", "Completada"];
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    fechaEntrega: "",
    puntos: "",
    materia: "",
    escuela: "",
    grado: "",
    seccion: "",
    estado: "",
    comentarios: "",
  });
  const [editId, setEditId] = useState(null);
  const profesorId = auth.currentUser?.uid;

  useEffect(() => {
    fetchTareas();
    fetchMaterias();
    fetchEscuelas();
  }, []);

  const fetchTareas = async () => {
    if (!profesorId) return;
    try {
      const q = query(collection(db, "tareas"), where("profesorId", "==", profesorId));
      const querySnapshot = await getDocs(q);
      const tareasData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTareas(tareasData);
    } catch (error) {
      toast.error("Error al cargar las tareas.");
    }
  };

  const fetchMaterias = async () => {
    if (!profesorId) return;
    try {
      const q = query(collection(db, "materias"), where("profesorId", "==", profesorId));
      const querySnapshot = await getDocs(q);
      const materiasData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMaterias(materiasData);
    } catch (error) {
      toast.error("Error al cargar las materias.");
    }
  };

  const fetchEscuelas = async () => {
    if (!profesorId) return;
    try {
      const q = query(collection(db, "escuelas"), where("profesorId", "==", profesorId));
      const querySnapshot = await getDocs(q);
      const escuelasData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setEscuelas(escuelasData);
    } catch (error) {
      toast.error("Error al cargar las escuelas.");
    }
  };

  const fetchGrados = async (escuelaId) => {
    if (!profesorId || !escuelaId) return;
    try {
      const q = query(collection(db, "grados"), where("profesorId", "==", profesorId), where("escuelaId", "==", escuelaId));
      const querySnapshot = await getDocs(q);
      const gradosData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setGrados(gradosData);
    } catch (error) {
      console.error("Error al obtener grados:", error);
    }
  };

  const fetchSecciones = (gradoId) => {
    const gradoSeleccionado = grados.find((grado) => grado.id === gradoId);
    if (gradoSeleccionado) {
      setSecciones(gradoSeleccionado.secciones || []);
    }
  };

  const fetchMateriasFiltradas = async (escuelaId, gradoId) => {
    if (!profesorId || !escuelaId || !gradoId) return;
    try {
      const q = query(
        collection(db, "materias"),
        where("profesorId", "==", profesorId),
        where("escuelaId", "==", escuelaId),
        where("gradoId", "==", gradoId)
      );
      const querySnapshot = await getDocs(q);
      const materiasFiltradas = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMaterias(materiasFiltradas);
    } catch (error) {
      console.error("Error al obtener materias filtradas:", error);
    }
  };

  const handleAddOrUpdateTarea = async (e) => {
    e.preventDefault();
    if (!profesorId) return;

    try {
      const escuelaSeleccionada = escuelas.find((escuela) => escuela.id === formData.escuela);
      const gradoSeleccionado = grados.find((grado) => grado.id === formData.grado);

      const tareaData = {
        ...formData,
        escuela: escuelaSeleccionada?.nombre || "",
        grado: gradoSeleccionado?.grado || "",
      };

      if (editId) {
        await updateDoc(doc(db, "tareas", editId), tareaData);
        toast.success("Tarea actualizada correctamente.");
      } else {
        await addDoc(collection(db, "tareas"), { ...tareaData, profesorId, createdAt: new Date() });
        toast.success("Tarea creada correctamente.");
      }

      setIsModalOpen(false);
      setFormData({
        titulo: "",
        descripcion: "",
        fechaEntrega: "",
        puntos: "",
        materia: "",
        escuela: "",
        grado: "",
        seccion: "",
        estado: "",
        comentarios: "",
      });
      setEditId(null);
      fetchTareas();
    } catch (error) {
      toast.error("Error al guardar la tarea.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, "tareas", deleteId));
      setTareas((prev) => prev.filter((tarea) => tarea.id !== deleteId));
      toast.success("Tarea eliminada correctamente.");
      setIsConfirmOpen(false);
      setDeleteId(null);
    } catch (error) {
      toast.error("Error al eliminar la tarea.");
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleEdit = (tarea) => {
    setFormData(tarea);
    setEditId(tarea.id);
    setIsModalOpen(true);
  };

  const handleSchoolSelection = (escuelaId) => {
    setFormData({ ...formData, escuela: escuelaId, grado: "", seccion: "" });
    fetchGrados(escuelaId);
  };

  const handleGradeSelection = (gradoId) => {
    setFormData({ ...formData, grado: gradoId, seccion: "", materia: "" });
    fetchSecciones(gradoId);
    fetchMateriasFiltradas(formData.escuela, gradoId);
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
            <li key={tarea.id} className="bg-gray-800 p-4 rounded-lg relative">
              <div
                className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold ${tarea.estado === "Pendiente"
                    ? "bg-yellow-500 text-black"
                    : tarea.estado === "En Progreso"
                      ? "bg-blue-500 text-white"
                      : "bg-green-500 text-white"
                  }`}
              >
                {tarea.estado}
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">{tarea.titulo}</h3>
                  <p className="text-gray-400">{tarea.descripcion}</p>
                  <p className="text-sm text-gray-500">Entrega: {tarea.fechaEntrega}</p>
                  <p className="text-sm text-gray-500">Puntos: {tarea.puntos}</p>
                  <p className="text-sm text-gray-500">Materia: {tarea.materia}</p>
                  <p className="text-sm text-gray-500">Escuela: {tarea.escuela}</p>
                  <p className="text-sm text-gray-500">Grado: {tarea.grado}</p>
                  <p className="text-sm text-gray-500">Sección: {tarea.seccion}</p>
                  <p className="text-sm text-gray-500">Comentarios: {tarea.comentarios || "Sin comentarios"}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(tarea)} className="text-yellow-400 hover:text-yellow-300">
                    <Pencil size={20} />
                  </button>
                  <button onClick={() => confirmDelete(tarea.id)} className="text-red-500 hover:text-red-300">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[600px] relative">
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
          >
            ✕
          </button>
          <h2 className="text-xl font-bold mb-4">{editId ? "Editar Tarea" : "Nueva Tarea"}</h2>
          <form onSubmit={handleAddOrUpdateTarea} className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Título"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
              />
            </div>
            <div>
              <input
                type="date"
                value={formData.fechaEntrega}
                onChange={(e) => setFormData({ ...formData, fechaEntrega: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
              />
            </div>
            <div>
              <textarea
                placeholder="Descripción"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Puntos"
                value={formData.puntos}
                onChange={(e) => setFormData({ ...formData, puntos: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
              />
            </div>
            <div>
              <select
                value={formData.escuela}
                onChange={(e) => handleSchoolSelection(e.target.value)}
                className="p-2 bg-gray-700 rounded w-full"
                required
              >
                <option value="">Seleccionar Escuela</option>
                {escuelas.map((escuela) => (
                  <option key={escuela.id} value={escuela.id}>
                    {escuela.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={formData.grado}
                onChange={(e) => handleGradeSelection(e.target.value)}
                className="p-2 bg-gray-700 rounded w-full"
                required
                disabled={!formData.escuela}
              >
                <option value="">Seleccionar Grado</option>
                {grados.map((grado) => (
                  <option key={grado.id} value={grado.id}>
                    {grado.grado}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={formData.seccion}
                onChange={(e) => setFormData({ ...formData, seccion: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
                disabled={!formData.grado}
              >
                <option value="">Seleccionar Sección</option>
                {secciones.map((seccion, index) => (
                  <option key={index} value={seccion}>
                    {seccion}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={formData.materia}
                onChange={(e) => setFormData({ ...formData, materia: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
                disabled={!formData.grado}
              >
                <option value="">Seleccionar Materia</option>
                {materias.map((materia) => (
                  <option key={materia.id} value={materia.nombre}>
                    {materia.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
                required
              >
                <option value="">Seleccionar Estado</option>
                {estadosTarea.map((estado, index) => (
                  <option key={index} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <textarea
                placeholder="Comentarios"
                value={formData.comentarios}
                onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
                className="p-2 bg-gray-700 rounded w-full"
              />
            </div>
            <div className="col-span-2 flex justify-end mt-6 space-x-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
              >
                {editId ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      </Dialog>
      <Dialog open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[400px]">
          <h2 className="text-xl font-bold mb-4">Confirmar eliminación</h2>
          <p className="text-gray-400 mb-6">¿Estás seguro de que deseas eliminar esta tarea?</p>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setIsConfirmOpen(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Tareas;
