import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebaseConfig";
import Header from "../components/Header";
import { toast } from "react-toastify";
import { Plus, Pencil, Trash2 } from "lucide-react"; // Importar íconos
import { Dialog } from "@headlessui/react"; // Importar Dialog para confirmación

const Materias = () => {
  const [user] = useAuthState(auth);
  const [materias, setMaterias] = useState([]);
  const [materiaForm, setMateriaForm] = useState({ nombre: "", descripcion: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editingMateriaId, setEditingMateriaId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Controlar la visibilidad del modal
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Controlar la visibilidad del diálogo
  const [materiaToDelete, setMateriaToDelete] = useState(null); // Materia seleccionada para eliminar
  const [currentPage, setCurrentPage] = useState(1); // Página actual
  const itemsPerPage = 10; // Número de materias por página

  const totalPages = Math.ceil(materias.length / itemsPerPage); // Total de páginas
  const paginatedMaterias = materias
    .sort((a, b) => a.orden - b.orden) // Ordenar por el campo orden
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage); // Materias de la página actual

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  useEffect(() => {
    const fetchMaterias = async () => {
      if (!user) return;

      try {
        const materiasQuery = query(
          collection(db, "materias"),
          where("profesorId", "==", user.uid) // Filtrar por el profesor autenticado
        );
        const materiasSnapshot = await getDocs(materiasQuery);
        const materiasData = materiasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMaterias(materiasData);
      } catch (error) {
        console.error("Error al obtener las materias:", error);
      }
    };

    fetchMaterias();
  }, [user]);

  const handleCreateMateria = async () => {
    if (!user) return;

    try {
      const newMateria = {
        ...materiaForm,
        profesorId: user.uid,
        orden: materias.length + 1, // Asignar el orden automáticamente
        createdAt: new Date(),
      };

      const materiasRef = collection(db, "materias");
      const docRef = await addDoc(materiasRef, newMateria);

      setMaterias((prevMaterias) => [...prevMaterias, { id: docRef.id, ...newMateria }]);
      setMateriaForm({ nombre: "", descripcion: "" }); // Limpiar el formulario
      setIsModalOpen(false); // Cerrar el modal
      toast.success("Materia creada exitosamente.");
    } catch (error) {
      console.error("Error al crear la materia:", error);
      toast.error("Error al crear la materia.");
    }
  };

  const handleEditMateria = async () => {
    if (!editingMateriaId) return;

    try {
      const materiaRef = doc(db, "materias", editingMateriaId);
      await updateDoc(materiaRef, {
        nombre: materiaForm.nombre,
        descripcion: materiaForm.descripcion,
      });

      setMaterias(
        materias.map((materia) =>
          materia.id === editingMateriaId
            ? { ...materia, ...materiaForm }
            : materia
        )
      );

      setMateriaForm({ nombre: "", descripcion: "" }); // Limpiar el formulario
      setIsEditing(false);
      setEditingMateriaId(null);
      setIsModalOpen(false); // Cerrar el modal
      toast.success("Materia actualizada exitosamente.");
    } catch (error) {
      console.error("Error al editar la materia:", error);
      toast.error("Error al editar la materia.");
    }
  };

  const handleDeleteMateria = async () => {
    if (!materiaToDelete) return;

    try {
      const materiaRef = doc(db, "materias", materiaToDelete.id);
      await deleteDoc(materiaRef);

      setMaterias(materias.filter((materia) => materia.id !== materiaToDelete.id));
      setIsDialogOpen(false); // Cerrar el diálogo
      toast.success("Materia eliminada exitosamente.");
    } catch (error) {
      console.error("Error al eliminar la materia:", error);
      toast.error("Error al eliminar la materia.");
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4 sm:p-6">
      <Header />
      <div className="w-full text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-purple-400">Gestión de Materias</h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Crea, edita y elimina materias fácilmente.
        </p>
      </div>

      <div className="w-full flex justify-end mb-4">
        <button
          onClick={() => {
            setIsEditing(false);
            setMateriaForm({ nombre: "", descripcion: "" });
            setIsModalOpen(true); // Abrir el modal
          }}
          className="bg-purple-500 hover:bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-md flex items-center gap-2"
        >
          <Plus size={16} />
          Crear Materia
        </button>
      </div>

      <div className="w-full mb-4 overflow-x-auto">
        {materias.length === 0 ? (
          <p className="text-gray-400 text-center mt-4">No hay materias creadas.</p>
        ) : (
          <>
            <table className="table-auto w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="border px-2 sm:px-4 py-2">N°</th>
                  <th className="border px-2 sm:px-4 py-2">Nombre</th>
                  <th className="border px-2 sm:px-4 py-2">Descripción</th>
                  <th className="border px-2 sm:px-4 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMaterias.map((materia, index) => (
                  <tr key={materia.id} className="bg-gray-700 hover:bg-gray-600">
                    <td className="border px-2 sm:px-4 py-2 text-center">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="border px-2 sm:px-4 py-2">{materia.nombre}</td>
                    <td className="border px-2 sm:px-4 py-2">{materia.descripcion}</td>
                    <td className="border px-2 sm:px-4 py-2 flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setMateriaForm({
                            nombre: materia.nombre,
                            descripcion: materia.descripcion,
                          });
                          setIsEditing(true);
                          setEditingMateriaId(materia.id);
                          setIsModalOpen(true); // Abrir el modal
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 sm:px-3 py-1 rounded flex items-center gap-1"
                      >
                        <Pencil size={16} />
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          setMateriaToDelete(materia);
                          setIsDialogOpen(true); // Abrir el diálogo
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-1 rounded flex items-center gap-1"
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-md ${currentPage === 1 ? "bg-gray-600 cursor-not-allowed" : "bg-purple-500 hover:bg-purple-600"
                  } text-white`}
              >
                Anterior
              </button>
              <p className="text-gray-400">
                Página {currentPage} de {totalPages}
              </p>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-md ${currentPage === totalPages ? "bg-gray-600 cursor-not-allowed" : "bg-purple-500 hover:bg-purple-600"
                  } text-white`}
              >
                Siguiente
              </button>
            </div>
          </>
        )}
      </div>

      {isModalOpen && ( // Mostrar el modal solo si isModalOpen es true
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-bold text-purple-400 mb-4">
              {isEditing ? "Editar Materia" : "Crear Materia"}
            </h2>
            <input
              type="text"
              placeholder="Nombre de la materia"
              value={materiaForm.nombre}
              onChange={(e) =>
                setMateriaForm({ ...materiaForm, nombre: e.target.value })
              }
              className="w-full p-2 mb-4 border border-gray-700 rounded bg-gray-900 text-white"
            />
            <textarea
              placeholder="Descripción de la materia"
              value={materiaForm.descripcion}
              onChange={(e) =>
                setMateriaForm({ ...materiaForm, descripcion: e.target.value })
              }
              className="w-full p-2 mb-4 border border-gray-700 rounded bg-gray-900 text-white"
            ></textarea>
            <div className="flex justify-end gap-2 sm:gap-4">
              <button
                onClick={() => {
                  setIsModalOpen(false); // Cerrar el modal
                  setMateriaForm({ nombre: "", descripcion: "" });
                  setIsEditing(false);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={isEditing ? handleEditMateria : handleCreateMateria}
                className="bg-purple-500 hover:bg-purple-600 text-white px-3 sm:px-4 py-2 rounded"
              >
                {isEditing ? "Guardar Cambios" : "Crear Materia"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      >
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full">
          <Dialog.Title className="text-lg font-bold text-white">
            Confirmar Eliminación
          </Dialog.Title>
          <Dialog.Description className="text-gray-400 mt-2">
            ¿Estás seguro de que deseas eliminar la materia{" "}
            <span className="font-bold text-white">{materiaToDelete?.nombre}</span>?
          </Dialog.Description>
          <div className="flex justify-end gap-4 mt-4">
            <button
              onClick={() => setIsDialogOpen(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteMateria}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Materias;
