import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig"; // Asegúrate de importar tu configuración de Firebase
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebaseConfig"; // Asegúrate de importar tu configuración de Firebase
import { toast } from "react-toastify";

const Materias = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    profesor: "",
    horario: "",
  });
  const [materias, setMaterias] = useState([]);
  const [showForm, setShowForm] = useState(false); // Controlar si se muestra el formulario
  const [editingMateria, setEditingMateria] = useState(null); // Controlar si se está editando una materia
  const [user] = useAuthState(auth); // Obtener el usuario autenticado

  useEffect(() => {
    const fetchMaterias = async () => {
      if (!user) return;

      try {
        const q = query(collection(db, "materias"), where("profesorId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const materiasData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setMaterias(materiasData);
      } catch (error) {
        console.error("Error al obtener las materias:", error);
        toast.error("No se pudieron cargar las materias");
      }
    };

    fetchMaterias();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Debes estar autenticado para realizar esta acción");
      return;
    }

    try {
      if (editingMateria) {
        // Actualizar materia existente
        await updateDoc(doc(db, "materias", editingMateria.id), formData);
        toast.success("Materia actualizada correctamente");
        setMaterias((prev) =>
          prev.map((materia) =>
            materia.id === editingMateria.id ? { ...materia, ...formData } : materia
          )
        );
      } else {
        // Crear nueva materia
        const docRef = await addDoc(collection(db, "materias"), {
          ...formData,
          profesorId: user.uid, // Asociar la materia al ID del profesor
          createdAt: new Date(),
        });
        toast.success("Materia guardada correctamente");
        setMaterias((prev) => [...prev, { id: docRef.id, ...formData, profesorId: user.uid }]);
      }

      setFormData({
        nombre: "",
        descripcion: "",
        profesor: "",
        horario: "",
      });
      setShowForm(false); // Ocultar el formulario después de guardar
      setEditingMateria(null); // Salir del modo de edición
    } catch (error) {
      console.error("Error al guardar la materia:", error);
      toast.error("No se pudo guardar la materia");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "materias", id));
      setMaterias((prev) => prev.filter((materia) => materia.id !== id));
      toast.success("Materia eliminada correctamente");
    } catch (error) {
      console.error("Error al eliminar la materia:", error);
      toast.error("No se pudo eliminar la materia");
    }
  };

  const handleEdit = (materia) => {
    setFormData(materia);
    setEditingMateria(materia);
    setShowForm(true);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-6">
      <div className="w-full max-w-5xl flex justify-between items-center mb-6 mt-6">
        <h2 className="text-3xl font-bold">Gestión de Materias</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingMateria(null); // Asegurarse de que no esté en modo edición
            setFormData({
              nombre: "",
              descripcion: "",
              profesor: "",
              horario: "",
            });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
        >
          Crear Materia
        </button>
      </div>

      {materias.length === 0 && !showForm ? (
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-4">No tienes materias registradas.</p>
        </div>
      ) : showForm ? (
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
          <h3 className="text-xl font-bold mb-4">{editingMateria ? "Editar Materia" : "Nueva Materia"}</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-gray-300">Nombre de la Materia</label>
              <input
                type="text"
                name="nombre"
                className="w-full p-3 rounded bg-gray-700"
                placeholder="Ejemplo: Matemáticas"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-gray-300">Descripción</label>
              <textarea
                name="descripcion"
                className="w-full p-3 rounded bg-gray-700"
                placeholder="Breve descripción de la materia"
                value={formData.descripcion}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <div>
              <label className="block text-gray-300">Profesor Asignado</label>
              <input
                type="text"
                name="profesor"
                className="w-full p-3 rounded bg-gray-700"
                placeholder="Nombre del profesor"
                value={formData.profesor}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-gray-300">Horario</label>
              <input
                type="text"
                name="horario"
                className="w-full p-3 rounded bg-gray-700"
                placeholder="Ejemplo: Lunes y Miércoles 10:00 - 12:00"
                value={formData.horario}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded mt-6 transition"
          >
            {editingMateria ? "Actualizar Materia" : "Guardar Materia"}
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
          {materias.map((materia) => (
            <div key={materia.id} className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-2">{materia.nombre}</h3>
              <p className="text-gray-400 mb-2">{materia.descripcion}</p>
              <p className="text-gray-300">
                <strong>Profesor:</strong> {materia.profesor}
              </p>
              <p className="text-gray-300">
                <strong>Horario:</strong> {materia.horario}
              </p>
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  onClick={() => handleEdit(materia)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(materia.id)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Materias;