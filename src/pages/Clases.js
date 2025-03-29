import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Dialog } from "@headlessui/react";
import { Plus, Trash2, Edit } from "lucide-react";
import Header from "../components/Header";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Clases = () => {
  const [clases, setClases] = useState([]);
  const [escuelas, setEscuelas] = useState([]); // Estado para almacenar las escuelas
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedClase, setSelectedClase] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    horario: new Date(), // Inicializa con la fecha actual
    ubicacion: "",
    capacidad: "",
    materia: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMateria, setFilterMateria] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const profesorId = auth.currentUser?.uid;

  useEffect(() => {
    fetchClases();
    fetchEscuelas();
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

  const handleGuardarClase = async (e) => {
    e.preventDefault();
    if (!profesorId) {
      toast.error("No se pudo guardar la clase. Usuario no autenticado.");
      return;
    }

    try {
      if (selectedClase) {
        // Actualizar clase existente
        const claseRef = doc(db, "clases", selectedClase.id);
        await updateDoc(claseRef, formData);
        toast.success("Clase actualizada correctamente.");
      } else {
        // Crear nueva clase
        await addDoc(collection(db, "clases"), {
          ...formData,
          horario: formData.horario.toISOString(), // Guarda la fecha en formato ISO
          profesorId,
          createdAt: new Date(),
        });
        toast.success("Clase creada correctamente.");
      }

      // Limpiar el formulario y cerrar el modal
      setFormData({ nombre: "", descripcion: "", horario: new Date(), ubicacion: "", capacidad: "", materia: "" });
      setSelectedClase(null);
      setIsModalOpen(false);

      // Actualizar la lista de clases
      fetchClases();
    } catch (error) {
      toast.error("Error al guardar la clase.");
      console.error("Error al guardar la clase:", error);
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
      toast.success("Clase eliminada correctamente.");
      setIsConfirmDialogOpen(false);
      setSelectedClase(null);

      // Actualizar la lista de clases
      fetchClases();
    } catch (error) {
      toast.error("Error al eliminar la clase.");
      console.error("Error al eliminar clase:", error);
    }
  };

  const filteredClases = clases.filter((clase) => {
    return (
      clase.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterMateria === "" || clase.materia === filterMateria)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClases = filteredClases.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredClases.length / itemsPerPage);

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <Header />
      <div className="flex justify-between items-center mb-4 mt-8">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 bg-gray-700 rounded w-1/3"
        />
        <select
          value={filterMateria}
          onChange={(e) => setFilterMateria(e.target.value)}
          className="p-2 bg-gray-700 rounded"
        >
          <option value="">Todas las materias</option>
          {[...new Set(clases.map((clase) => clase.materia))].map((materia) => (
            <option key={materia} value={materia}>
              {materia}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end items-center mb-4 mt-9">
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
          <Plus size={18} /> Nueva Clase
        </button>
      </div>

      {clases.length === 0 ? (
        <p className="text-gray-400 text-center">No tienes clases registradas.</p>
      ) : filteredClases.length === 0 ? (
        <p className="text-gray-400 text-center">No se encontraron clases con los filtros aplicados.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentClases.map((clase) => (
            <div
              key={clase.id}
              className="bg-gray-800 p-4 rounded-lg shadow-lg relative hover:scale-105 transition-transform duration-200"
            >
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
              <p className="text-gray-500 text-sm">🕒 {new Date(clase.horario).toLocaleString()}</p>
              <p className="text-gray-500 text-sm">🏫 Escuela: {clase.ubicacion}</p>
              <p className="text-gray-500 text-sm">👥 Capacidad: {clase.capacidad}</p>
              <p className="text-gray-500 text-sm">📖 Materia: {clase.materia}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center mt-4">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index + 1)}
            className={`px-3 py-1 mx-1 rounded ${currentPage === index + 1 ? "bg-blue-600" : "bg-gray-700"
              }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Modal para agregar/editar clases */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-[400px]">
          <h2 className="text-xl font-bold mb-4">{selectedClase ? "Editar Clase" : "Crear Clase"}</h2>
          <form onSubmit={handleGuardarClase} className="space-y-3">
            <input type="text" name="nombre" placeholder="Nombre de la Clase" value={formData.nombre} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded" required />
            <textarea name="descripcion" placeholder="Descripción" value={formData.descripcion} onChange={handleChange} className="w-full p-2 bg-gray-700 rounded" required />
            <DatePicker
              selected={formData.horario}
              onChange={(date) => setFormData({ ...formData, horario: date })}
              showTimeSelect
              dateFormat="Pp"
              className="w-full p-2 bg-gray-700 rounded"
            />
            <select
              name="ubicacion"
              value={formData.ubicacion}
              onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
              className="w-full p-2 bg-gray-700 rounded"
              required
            >
              <option value="">Selecciona una escuela</option>
              {escuelas.map((escuela) => (
                <option key={escuela.id} value={escuela.nombre}>
                  {escuela.nombre}
                </option>
              ))}
            </select>
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
